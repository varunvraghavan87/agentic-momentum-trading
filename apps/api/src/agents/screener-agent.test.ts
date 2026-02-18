import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createTestDb, type TestDb } from '../__tests__/helpers/test-db.js';
import { ScreenerAgent } from './screener-agent.js';
import { AgentBus } from './agent-bus.js';

vi.mock('../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const TEST_DATE = '2025-01-15';

function seedScreenerData(sqlite: ReturnType<typeof createTestDb>['sqlite'], date: string) {
  const insertInstrument = sqlite.prepare(`
    INSERT INTO instruments (instrument_token, tradingsymbol, name, exchange, is_nifty500, is_asm, is_gsm, market_cap, updated_at)
    VALUES (?, ?, ?, 'NSE', ?, ?, ?, ?, ?)
  `);

  const updatedAt = new Date().toISOString();

  // STOCK_A through STOCK_E: PASS fundamental (isNifty500=1, isASM=0, isGSM=0, marketCap=10000)
  const passSymbols = ['STOCK_A', 'STOCK_B', 'STOCK_C', 'STOCK_D', 'STOCK_E'];
  passSymbols.forEach((sym, i) => {
    insertInstrument.run(1001 + i, sym, sym, 1, 0, 0, 10000, updatedAt);
  });

  // STOCK_F through STOCK_J: FAIL low market cap (isNifty500=1, isASM=0, isGSM=0, marketCap=3000)
  const lowCapSymbols = ['STOCK_F', 'STOCK_G', 'STOCK_H', 'STOCK_I', 'STOCK_J'];
  lowCapSymbols.forEach((sym, i) => {
    insertInstrument.run(1006 + i, sym, sym, 1, 0, 0, 3000, updatedAt);
  });

  // STOCK_K through STOCK_O: FAIL not eligible (various reasons)
  const ineligibleConfigs: Array<[number, number]> = [
    [0, 0], // not nifty500
    [1, 1], // isASM
    [0, 0], // not nifty500
    [1, 1], // isASM
    [0, 0], // not nifty500
  ];
  const ineligibleSymbols = ['STOCK_K', 'STOCK_L', 'STOCK_M', 'STOCK_N', 'STOCK_O'];
  ineligibleSymbols.forEach((sym, i) => {
    const [isNifty500, isASM] = ineligibleConfigs[i];
    insertInstrument.run(1011 + i, sym, sym, isNifty500, isASM, 0, 10000, updatedAt);
  });

  // STOCK_P through STOCK_T: pass fundamental but no snapshots
  const noSnapSymbols = ['STOCK_P', 'STOCK_Q', 'STOCK_R', 'STOCK_S', 'STOCK_T'];
  noSnapSymbols.forEach((sym, i) => {
    insertInstrument.run(1016 + i, sym, sym, 1, 0, 0, 10000, updatedAt);
  });

  // --- Indicator snapshots ---
  const insertSnapshot = sqlite.prepare(`
    INSERT INTO indicator_snapshots (tradingsymbol, date, ema20, ema50, ema200, rsi14, adx14, atr14, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createdAt = new Date().toISOString();

  // STOCK_A-E: PASS technical (ema20 > ema50, adx > 25, rsi between 40-70)
  const passingSnapshots: Array<[string, number, number, number, number, number, number]> = [
    ['STOCK_A', 110, 100, 90, 55, 40, 5],
    ['STOCK_B', 108, 100, 90, 50, 35, 4],
    ['STOCK_C', 106, 100, 90, 60, 30, 3.5],
    ['STOCK_D', 104, 100, 90, 45, 28, 3],
    ['STOCK_E', 102, 100, 90, 65, 26, 2.5],
  ];
  for (const [sym, ema20, ema50, ema200, rsi14, adx14, atr14] of passingSnapshots) {
    insertSnapshot.run(sym, date, ema20, ema50, ema200, rsi14, adx14, atr14, createdAt);
  }

  // STOCK_F-J: good technical but fail phase 1 due to low market cap
  const lowCapSnapshots = ['STOCK_F', 'STOCK_G', 'STOCK_H', 'STOCK_I', 'STOCK_J'];
  for (const sym of lowCapSnapshots) {
    insertSnapshot.run(sym, date, 110, 100, 90, 55, 40, 5, createdAt);
  }

  // STOCK_K-O: doesn't matter — fail fundamental filter
  const ineligibleSnapshots = ['STOCK_K', 'STOCK_L', 'STOCK_M', 'STOCK_N', 'STOCK_O'];
  for (const sym of ineligibleSnapshots) {
    insertSnapshot.run(sym, date, 95, 100, 90, 50, 20, 3, createdAt);
  }

  // --- Market data (one row each for STOCK_A-E) ---
  const insertMarketData = sqlite.prepare(`
    INSERT INTO market_data (instrument_token, tradingsymbol, timestamp, open, high, low, close, volume, interval)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'day')
  `);

  const closes: Array<[string, number, number]> = [
    ['STOCK_A', 1001, 112],
    ['STOCK_B', 1002, 110],
    ['STOCK_C', 1003, 108],
    ['STOCK_D', 1004, 105],
    ['STOCK_E', 1005, 103],
  ];
  for (const [sym, token, close] of closes) {
    insertMarketData.run(token, sym, date, close - 2, close + 1, close - 3, close, 100000);
  }
}

describe('ScreenerAgent', () => {
  let testDb: TestDb;
  let tmpDir: string;
  let bus: AgentBus;
  let agent: ScreenerAgent;

  beforeEach(() => {
    testDb = createTestDb();
    tmpDir = mkdtempSync(join(tmpdir(), 'amt-bus-'));
    bus = new AgentBus(tmpDir);
    agent = new ScreenerAgent(testDb.db as any, bus, {} as any);
    seedScreenerData(testDb.sqlite, TEST_DATE);
  });

  afterEach(() => {
    testDb.cleanup();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns exactly 5 candidates from 20 instruments', async () => {
    const result = await agent.execute({ date: TEST_DATE });

    expect(result.status).toBe('success');
    expect(result.data.candidateCount).toBe(5);
    expect(result.data.candidates).toHaveLength(5);

    const symbols = result.data.candidates.map((c: any) => c.tradingsymbol);
    expect(symbols).toContain('STOCK_A');
    expect(symbols).toContain('STOCK_B');
    expect(symbols).toContain('STOCK_C');
    expect(symbols).toContain('STOCK_D');
    expect(symbols).toContain('STOCK_E');
  });

  it('candidates sorted by ADX descending', async () => {
    const result = await agent.execute({ date: TEST_DATE });

    const candidates = result.data.candidates;
    expect(candidates[0].adx14).toBe(40);
    expect(candidates[1].adx14).toBe(35);
    expect(candidates[2].adx14).toBe(30);
    expect(candidates[3].adx14).toBe(28);
    expect(candidates[4].adx14).toBe(26);
  });

  it('output published to AgentBus filesystem', async () => {
    await agent.execute({ date: TEST_DATE });

    const stored = await bus.getStageResult<any>('screener', TEST_DATE);
    expect(stored.candidateCount).toBe(5);
    expect(stored.candidates).toHaveLength(5);

    const filePath = join(tmpDir, 'screener', `${TEST_DATE}.json`);
    expect(existsSync(filePath)).toBe(true);
  });
});
