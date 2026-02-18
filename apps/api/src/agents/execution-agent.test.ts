import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ExecutionAgent } from './execution-agent';
import { AgentBus } from './agent-bus';
import { createTestDb, type TestDb } from '../__tests__/helpers/test-db';
import { MockBroker } from '../__tests__/mocks/mock-broker';
import type { IRiskManager, IPositionSizer } from './execution-agent';

vi.mock('../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../config/trading.js', () => ({
  TRADING_CONSTANTS: { ALGO_TAG: 'AMT001' },
}));

const TEST_DATE = '2025-01-15';

function seedAnalystOutput(busDir: string, date: string) {
  const analystDir = join(busDir, 'analyst');
  mkdirSync(analystDir, { recursive: true });

  const analystOutput = {
    date,
    analyses: [
      {
        ticker: 'INFY', action: 'BUY', confidence: 0.8,
        entry: 1500, stopLoss: 1450, target: 1600,
        reasoning: 'Strong trend', setupQuality: 'A', keyRisks: ['Risk1'],
      },
      {
        ticker: 'RELIANCE', action: 'BUY', confidence: 0.75,
        entry: 2500, stopLoss: 2450, target: 2600,
        reasoning: 'Mean reversion', setupQuality: 'B', keyRisks: ['Risk2'],
      },
    ],
    summary: 'Two setups',
    topPick: 'INFY',
  };

  writeFileSync(join(analystDir, `${date}.json`), JSON.stringify(analystOutput));
}

describe('ExecutionAgent', () => {
  let testDb: TestDb;
  let tmpDir: string;
  let bus: AgentBus;
  let mockBroker: MockBroker;
  let riskManager: IRiskManager;
  let positionSizer: IPositionSizer;
  let agent: ExecutionAgent;

  beforeEach(() => {
    testDb = createTestDb();
    tmpDir = mkdtempSync(join(tmpdir(), 'amt-exec-'));
    bus = new AgentBus(tmpDir);

    mockBroker = new MockBroker({
      'NSE:INFY': 1500, 'INFY': 1500,
      'NSE:RELIANCE': 2500, 'RELIANCE': 2500,
    });

    riskManager = {
      isKillSwitchActive: vi.fn().mockResolvedValue(false),
      canOpenNewPosition: vi.fn().mockResolvedValue(true),
    };

    positionSizer = {
      calculate: vi.fn().mockResolvedValue({ shares: 50, riskAmount: 1000 }),
    };

    agent = new ExecutionAgent(
      mockBroker,
      riskManager,
      positionSizer,
      bus,
      testDb.db as any,
    );

    seedAnalystOutput(tmpDir, TEST_DATE);
  });

  afterEach(() => {
    testDb.cleanup();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('happy path: 2 BUY signals produce 4 orders (2 BUY + 2 SL)', async () => {
    const result = await agent.execute({ date: TEST_DATE });

    expect(result.status).toBe('success');
    expect(result.data.trades).toHaveLength(2);
    expect(mockBroker.placedOrders).toHaveLength(4);

    // Verify DB rows
    const rows = testDb.sqlite.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
    expect(rows.count).toBe(4);

    // Verify BUY orders
    const buyOrders = mockBroker.placedOrders.filter((o) => o.transactionType === 'BUY');
    expect(buyOrders).toHaveLength(2);
    for (const order of buyOrders) {
      expect(order.orderType).toBe('LIMIT');
      expect(order.transactionType).toBe('BUY');
    }

    // Verify SL orders
    const slOrders = mockBroker.placedOrders.filter((o) => o.transactionType === 'SELL');
    expect(slOrders).toHaveLength(2);
    for (const order of slOrders) {
      expect(order.orderType).toBe('SL');
      expect(order.transactionType).toBe('SELL');
    }
  });

  it('kill switch active returns early with reason', async () => {
    (riskManager.isKillSwitchActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const result = await agent.execute({ date: TEST_DATE });

    expect(result.status).toBe('success');
    expect(result.data.trades).toHaveLength(0);
    expect(result.data.reason).toBe('kill_switch_active');
    expect(mockBroker.placedOrders).toHaveLength(0);
  });

  it('price drift > 1% skips drifted signal', async () => {
    // INFY at 1500 -> 0% drift (within threshold)
    // RELIANCE at 2540 -> |2540-2500|/2500 = 1.6% drift (exceeds 1%)
    mockBroker.setLTP({
      'NSE:INFY': 1500, 'INFY': 1500,
      'NSE:RELIANCE': 2540, 'RELIANCE': 2540,
    });

    const result = await agent.execute({ date: TEST_DATE });

    expect(result.status).toBe('success');
    expect(result.data.trades).toHaveLength(1);
    expect(result.data.trades[0].ticker).toBe('INFY');
    expect(mockBroker.placedOrders).toHaveLength(2); // 1 BUY + 1 SL for INFY only
  });

  it('canOpenNewPosition false on second call skips remaining', async () => {
    (riskManager.canOpenNewPosition as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await agent.execute({ date: TEST_DATE });

    expect(result.status).toBe('success');
    expect(result.data.trades).toHaveLength(1);
  });
});
