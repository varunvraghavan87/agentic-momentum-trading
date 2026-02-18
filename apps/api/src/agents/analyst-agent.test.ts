import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { AnalystAgent } from './analyst-agent.js';
import { AgentBus } from './agent-bus.js';
import { createTestDb, type TestDb } from '../__tests__/helpers/test-db.js';
import { MockFallbackLLM } from '../__tests__/mocks/mock-fallback-llm.js';
import type { BatchAnalysis } from '@amt/shared';

vi.mock('../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const llmResponse = {
  date: '2025-01-15',
  analyses: [
    {
      ticker: 'INFY',
      action: 'BUY',
      confidence: 0.8,
      entry: 1500,
      stopLoss: 1450,
      target: 1600,
      reasoning: 'Strong uptrend with volume confirmation',
      setupQuality: 'A',
      keyRisks: ['Sector rotation risk'],
    },
    {
      ticker: 'TCS',
      action: 'SKIP',
      confidence: 0.4,
      entry: 3800,
      stopLoss: 3700,
      target: 4000,
      reasoning: 'Weak momentum',
      setupQuality: 'C',
      keyRisks: ['Earnings risk'],
    },
    {
      ticker: 'RELIANCE',
      action: 'BUY',
      confidence: 0.75,
      entry: 2500,
      stopLoss: 2450,
      target: 2600,
      reasoning: 'Mean reversion near EMA20',
      setupQuality: 'B',
      keyRisks: ['Oil price volatility'],
    },
  ],
  summary: 'Mixed signals, 2 actionable setups',
  topPick: 'INFY',
};

function seedScreenerOutput(busDir: string, date: string) {
  const screenerDir = join(busDir, 'screener');
  mkdirSync(screenerDir, { recursive: true });

  const screenerOutput = {
    date,
    candidateCount: 3,
    candidates: [
      {
        tradingsymbol: 'INFY',
        exchange: 'NSE',
        cmp: 1500,
        ema20: 1490,
        ema50: 1450,
        ema200: 1400,
        rsi14: 55,
        adx14: 35,
        atr14: 30,
        sector: 'IT',
        weeklyReturn: 0.02,
        volumeRatio: 1.3,
        marketCap: 50000,
        patterns: [],
      },
      {
        tradingsymbol: 'TCS',
        exchange: 'NSE',
        cmp: 3800,
        ema20: 3780,
        ema50: 3700,
        ema200: 3600,
        rsi14: 50,
        adx14: 28,
        atr14: 50,
        sector: 'IT',
        weeklyReturn: 0.01,
        volumeRatio: 1.1,
        marketCap: 100000,
        patterns: [],
      },
      {
        tradingsymbol: 'RELIANCE',
        exchange: 'NSE',
        cmp: 2500,
        ema20: 2490,
        ema50: 2450,
        ema200: 2400,
        rsi14: 60,
        adx14: 32,
        atr14: 40,
        sector: 'Energy',
        weeklyReturn: 0.015,
        volumeRatio: 1.5,
        marketCap: 150000,
        patterns: [],
      },
    ],
  };

  writeFileSync(join(screenerDir, `${date}.json`), JSON.stringify(screenerOutput));
}

describe('AnalystAgent', () => {
  let testDb: TestDb;
  let mockLLM: MockFallbackLLM;
  let bus: AgentBus;
  let agent: AnalystAgent;
  let busDir: string;
  const date = '2025-01-15';

  beforeEach(() => {
    testDb = createTestDb();
    mockLLM = new MockFallbackLLM(llmResponse);

    busDir = join(tmpdir(), `amt-bus-test-${randomUUID()}`);
    mkdirSync(busDir, { recursive: true });

    bus = new AgentBus(busDir);
    agent = new AnalystAgent(mockLLM, bus, testDb.db);

    seedScreenerOutput(busDir, date);
  });

  afterEach(() => {
    testDb.cleanup();
    try {
      rmSync(busDir, { recursive: true, force: true });
    } catch {
      /* ignore cleanup errors */
    }
  });

  it('reads screener output, calls LLM, persists BUY signals to DB', async () => {
    await agent.execute({ date });

    // LLM was called exactly once
    expect(mockLLM.calls.length).toBe(1);

    // Query DB for persisted trading signals
    const rows = testDb.sqlite
      .prepare("SELECT * FROM trading_signals WHERE date = '2025-01-15'")
      .all() as Array<Record<string, unknown>>;

    // Only BUY signals (INFY and RELIANCE) should be persisted, not TCS (SKIP)
    expect(rows.length).toBe(2);

    const infyRow = rows.find((r) => r.tradingsymbol === 'INFY')!;
    expect(infyRow).toBeDefined();
    expect(infyRow.entry).toBe(1500);
    expect(infyRow.stop_loss).toBe(1450);
    expect(infyRow.target).toBe(1600);
    expect(infyRow.confidence).toBe(0.8);
    expect(infyRow.phase).toBe('analyst');

    const relianceRow = rows.find((r) => r.tradingsymbol === 'RELIANCE')!;
    expect(relianceRow).toBeDefined();
    expect(relianceRow.entry).toBe(2500);
    expect(relianceRow.stop_loss).toBe(2450);
    expect(relianceRow.target).toBe(2600);
    expect(relianceRow.confidence).toBe(0.75);
    expect(relianceRow.phase).toBe('analyst');
  });

  it('returns valid BatchAnalysis with correct structure', async () => {
    const result = await agent.execute({ date });

    expect(result.status).toBe('success');

    const data = result.data as BatchAnalysis;
    expect(data.analyses.length).toBe(3);
    expect(data.topPick).toBe('INFY');
    expect(data.summary).toBe('Mixed signals, 2 actionable setups');
  });

  it('publishes analyst output to AgentBus', async () => {
    await agent.execute({ date });

    const published = await bus.getStageResult<BatchAnalysis>('analyst', date);
    expect(published.analyses.length).toBe(3);
  });
});
