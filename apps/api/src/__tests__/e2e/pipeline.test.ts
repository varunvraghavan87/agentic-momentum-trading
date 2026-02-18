import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ScreenerAgent } from '../../agents/screener-agent.js';
import { AnalystAgent } from '../../agents/analyst-agent.js';
import {
  ExecutionAgent,
  type IRiskManager,
  type IPositionSizer,
} from '../../agents/execution-agent.js';
import { AgentBus } from '../../agents/agent-bus.js';
import { createTestDb, type TestDb } from '../helpers/test-db.js';
import { MockFallbackLLM } from '../mocks/mock-fallback-llm.js';
import { MockBroker } from '../mocks/mock-broker.js';

vi.mock('../../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../config/trading.js', () => ({
  TRADING_CONSTANTS: {
    MIN_MARKET_CAP_CR: 5000,
    MIN_ADX: 25,
    RSI_LOWER: 40,
    RSI_UPPER: 70,
    ALGO_TAG: 'AMT001',
  },
}));

// ---------------------------------------------------------------------------
// Seeding helpers
// ---------------------------------------------------------------------------

function seedPipelineData(sqlite: any, date: string) {
  const symbols = ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'EPSILON'];
  const now = new Date().toISOString();

  // Insert 5 instruments (all Nifty500, high market cap)
  for (let i = 0; i < symbols.length; i++) {
    sqlite
      .prepare(
        `INSERT INTO instruments (instrument_token, tradingsymbol, name, exchange, is_nifty500, market_cap, is_asm, is_gsm, sector, updated_at)
         VALUES (?, ?, ?, 'NSE', 1, 15000, 0, 0, 'Tech', ?)`,
      )
      .run(2001 + i, symbols[i], symbols[i], now);
  }

  // Insert indicator snapshots that pass screener filters
  // ema20 > ema50, adx > 25, rsi between 40-70
  const adxValues = [42, 38, 33, 29, 26]; // sorted desc
  for (let i = 0; i < symbols.length; i++) {
    sqlite
      .prepare(
        `INSERT INTO indicator_snapshots (tradingsymbol, date, ema20, ema50, ema200, rsi14, adx14, atr14, weekly_return, volume_ratio, patterns, created_at)
         VALUES (?, ?, 520, 500, 480, 55, ?, 15, 0.02, 1.3, '[]', ?)`,
      )
      .run(symbols[i], date, adxValues[i], now);
  }

  // Insert market data (latest close > ema50 for each)
  for (let i = 0; i < symbols.length; i++) {
    sqlite
      .prepare(
        `INSERT INTO market_data (instrument_token, tradingsymbol, timestamp, open, high, low, close, volume, interval)
         VALUES (?, ?, ?, 515, 525, 510, 522, 500000, 'day')`,
      )
      .run(2001 + i, symbols[i], date);
  }
}

function seedFailingData(sqlite: any, date: string) {
  const symbols = ['FAIL_A', 'FAIL_B', 'FAIL_C'];
  const now = new Date().toISOString();

  // All instruments with isNifty500 = 0 => fail fundamental filter
  for (let i = 0; i < symbols.length; i++) {
    sqlite
      .prepare(
        `INSERT INTO instruments (instrument_token, tradingsymbol, name, exchange, is_nifty500, market_cap, is_asm, is_gsm, sector, updated_at)
         VALUES (?, ?, ?, 'NSE', 0, 15000, 0, 0, 'Tech', ?)`,
      )
      .run(3001 + i, symbols[i], symbols[i], now);
  }

  for (let i = 0; i < symbols.length; i++) {
    sqlite
      .prepare(
        `INSERT INTO indicator_snapshots (tradingsymbol, date, ema20, ema50, ema200, rsi14, adx14, atr14, weekly_return, volume_ratio, patterns, created_at)
         VALUES (?, ?, 520, 500, 480, 55, 35, 15, 0.02, 1.3, '[]', ?)`,
      )
      .run(symbols[i], date, now);
  }

  for (let i = 0; i < symbols.length; i++) {
    sqlite
      .prepare(
        `INSERT INTO market_data (instrument_token, tradingsymbol, timestamp, open, high, low, close, volume, interval)
         VALUES (?, ?, ?, 515, 525, 510, 522, 500000, 'day')`,
      )
      .run(3001 + i, symbols[i], date);
  }
}

// ---------------------------------------------------------------------------
// LLM response factory
// ---------------------------------------------------------------------------

function makeLLMResponse(date: string) {
  return {
    date,
    analyses: [
      {
        ticker: 'ALPHA',
        action: 'BUY',
        confidence: 0.85,
        entry: 522,
        stopLoss: 500,
        target: 566,
        reasoning: 'Strong momentum setup',
        setupQuality: 'A',
        keyRisks: ['Market risk'],
      },
      {
        ticker: 'BETA',
        action: 'BUY',
        confidence: 0.7,
        entry: 522,
        stopLoss: 500,
        target: 566,
        reasoning: 'Decent momentum',
        setupQuality: 'B',
        keyRisks: ['Sector risk'],
      },
      {
        ticker: 'GAMMA',
        action: 'SKIP',
        confidence: 0.3,
        entry: 522,
        stopLoss: 500,
        target: 566,
        reasoning: 'Weak setup',
        setupQuality: 'C',
        keyRisks: ['Volatility'],
      },
    ],
    summary: '2 actionable setups found',
    topPick: 'ALPHA',
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('E2E pipeline: Screener -> Analyst -> Execution', () => {
  const date = '2025-01-15';

  let testDb: TestDb;
  let tmpDir: string;
  let bus: AgentBus;
  let mockLLM: MockFallbackLLM;
  let mockBroker: MockBroker;
  let mockRiskManager: IRiskManager;
  let mockPositionSizer: IPositionSizer;
  let screenerAgent: ScreenerAgent;
  let analystAgent: AnalystAgent;
  let executionAgent: ExecutionAgent;

  beforeEach(() => {
    // Fresh DB and bus for every test
    testDb = createTestDb();
    tmpDir = mkdtempSync(join(tmpdir(), 'amt-pipeline-'));
    bus = new AgentBus(tmpDir);

    // LTP map: all symbols at 522 (matches entry, 0% drift)
    const ltpMap: Record<string, number> = {};
    for (const sym of ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'EPSILON']) {
      ltpMap[`NSE:${sym}`] = 522;
      ltpMap[sym] = 522;
    }

    mockBroker = new MockBroker(ltpMap);
    mockLLM = new MockFallbackLLM(makeLLMResponse(date));

    mockRiskManager = {
      isKillSwitchActive: vi.fn().mockResolvedValue(false),
      canOpenNewPosition: vi.fn().mockResolvedValue(true),
    };

    mockPositionSizer = {
      calculate: vi.fn().mockResolvedValue({ shares: 25, riskAmount: 550 }),
    };

    // Agents
    screenerAgent = new ScreenerAgent(testDb.db as any, bus, {} as any);
    analystAgent = new AnalystAgent(mockLLM, bus, testDb.db as any);
    executionAgent = new ExecutionAgent(
      mockBroker,
      mockRiskManager,
      mockPositionSizer,
      bus,
      testDb.db as any,
    );
  });

  afterEach(() => {
    testDb.cleanup();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it(
    'full pipeline produces signals in DB and orders via broker',
    async () => {
      seedPipelineData(testDb.sqlite, date);

      // Step 1: Screener
      const screenerResult = await screenerAgent.execute({ date });
      expect(screenerResult.status).toBe('success');
      expect(screenerResult.data.candidateCount).toBeGreaterThanOrEqual(1);

      // Step 2: Analyst
      const analystResult = await analystAgent.execute({ date });
      expect(analystResult.status).toBe('success');

      // Step 3: Execution
      const executionResult = await executionAgent.execute({ date });
      expect(executionResult.status).toBe('success');
      expect(executionResult.data.trades).toHaveLength(2);

      // Verify trading_signals in DB (2 BUY signals)
      const signalCount = testDb.sqlite
        .prepare(
          `SELECT COUNT(*) as cnt FROM trading_signals WHERE date = '${date}'`,
        )
        .get() as { cnt: number };
      expect(signalCount.cnt).toBe(2);

      // Verify orders in DB (2 BUY + 2 SL = 4)
      const orderCount = testDb.sqlite
        .prepare(`SELECT COUNT(*) as cnt FROM orders`)
        .get() as { cnt: number };
      expect(orderCount.cnt).toBe(4);

      // MockBroker should have received 4 placeOrder calls
      expect(mockBroker.placedOrders).toHaveLength(4);
    },
    30_000,
  );

  it(
    'AgentBus has all stage results after pipeline',
    async () => {
      seedPipelineData(testDb.sqlite, date);

      await screenerAgent.execute({ date });
      await analystAgent.execute({ date });
      await executionAgent.execute({ date });

      const screenerData = await bus.getStageResult<any>('screener', date);
      expect(screenerData.candidateCount).toBeGreaterThanOrEqual(1);

      const analystData = await bus.getStageResult<any>('analyst', date);
      expect(Array.isArray(analystData.analyses)).toBe(true);

      const executionData = await bus.getStageResult<any>('execution', date);
      expect(Array.isArray(executionData.trades)).toBe(true);
    },
    30_000,
  );

  it(
    'pipeline handles zero screener candidates gracefully',
    async () => {
      // Separate DB with instruments that FAIL the screener
      const failDb = createTestDb();
      const failTmpDir = mkdtempSync(join(tmpdir(), 'amt-pipeline-fail-'));
      const failBus = new AgentBus(failTmpDir);
      const failLLM = new MockFallbackLLM(makeLLMResponse(date));

      try {
        seedFailingData(failDb.sqlite, date);

        const failScreener = new ScreenerAgent(
          failDb.db as any,
          failBus,
          {} as any,
        );
        const failAnalyst = new AnalystAgent(
          failLLM,
          failBus,
          failDb.db as any,
        );
        const failExecution = new ExecutionAgent(
          mockBroker,
          mockRiskManager,
          mockPositionSizer,
          failBus,
          failDb.db as any,
        );

        // Reset broker state from any prior usage
        mockBroker.reset();

        const screenerResult = await failScreener.execute({ date });
        expect(screenerResult.data.candidateCount).toBe(0);

        const analystResult = await failAnalyst.execute({ date });
        expect(analystResult.data.analyses).toHaveLength(0);

        const executionResult = await failExecution.execute({ date });
        expect(executionResult.data.trades).toHaveLength(0);

        // LLM should never have been called
        expect(failLLM.calls).toHaveLength(0);
      } finally {
        failDb.cleanup();
        rmSync(failTmpDir, { recursive: true, force: true });
      }
    },
    30_000,
  );
});
