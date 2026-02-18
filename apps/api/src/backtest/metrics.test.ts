vi.mock('../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  computeCAGR,
  computeSharpeRatio,
  computeMaxDrawdown,
  computeWinRate,
} from './metrics';

describe('computeCAGR', () => {
  it('should return 1.0 for doubling in 1 year', () => {
    expect(computeCAGR(100, 200, 1)).toBe(1.0);
  });

  it('should return 0 for flat equity', () => {
    expect(computeCAGR(100, 100, 1)).toBe(0);
  });

  it('should return ~0.2247 for 100 -> 150 over 2 years', () => {
    expect(computeCAGR(100, 150, 2)).toBeCloseTo(0.2247, 2);
  });

  it('should return 0 when initial value is zero', () => {
    expect(computeCAGR(0, 100, 1)).toBe(0);
  });

  it('should return 0 when years is zero', () => {
    expect(computeCAGR(100, 200, 0)).toBe(0);
  });
});

describe('computeSharpeRatio', () => {
  it('should return 0 for empty returns', () => {
    expect(computeSharpeRatio([])).toBe(0);
  });

  it('should return 0 for single-element returns', () => {
    expect(computeSharpeRatio([0.01])).toBe(0);
  });

  it('should not crash for all-zero returns', () => {
    const result = computeSharpeRatio([0, 0, 0, 0, 0]);
    expect(typeof result).toBe('number');
    expect(Number.isFinite(result)).toBe(true);
  });

  it('should return a positive Sharpe for positive returns', () => {
    const dailyReturns = [0.01, 0.02, 0.015, 0.005, 0.01, 0.012, 0.008, 0.02, 0.015, 0.01];
    const result = computeSharpeRatio(dailyReturns);
    expect(result).toBeGreaterThan(0);
  });

  it('should give a large positive Sharpe for consistent daily returns of 0.001 over 252 days', () => {
    const dailyReturns = Array(252).fill(0.001);
    const result = computeSharpeRatio(dailyReturns);
    expect(result).toBeGreaterThan(0);
  });
});

describe('computeMaxDrawdown', () => {
  it('should compute correct drawdown for [100, 110, 90, 95, 100]', () => {
    // Peak is 110, trough is 90 => drawdown = 20/110 ≈ 0.1818
    const result = computeMaxDrawdown([100, 110, 90, 95, 100]);
    expect(result).toBeCloseTo(20 / 110, 4);
  });

  it('should return 0 for monotonically increasing curve', () => {
    expect(computeMaxDrawdown([100, 110, 120])).toBe(0);
  });

  it('should return 0 for empty array', () => {
    expect(computeMaxDrawdown([])).toBe(0);
  });

  it('should return 0 for single element', () => {
    expect(computeMaxDrawdown([100])).toBe(0);
  });
});

describe('computeWinRate', () => {
  it('should return 0.5 for one winner and one loser', () => {
    const trades = [
      { entryPrice: 100, exitPrice: 110 },
      { entryPrice: 100, exitPrice: 90 },
    ];
    expect(computeWinRate(trades)).toBe(0.5);
  });

  it('should return 1.0 for all winners', () => {
    const trades = [
      { entryPrice: 100, exitPrice: 110 },
      { entryPrice: 100, exitPrice: 120 },
      { entryPrice: 100, exitPrice: 105 },
    ];
    expect(computeWinRate(trades)).toBe(1.0);
  });

  it('should return 0 for all losers', () => {
    const trades = [
      { entryPrice: 100, exitPrice: 90 },
      { entryPrice: 100, exitPrice: 80 },
    ];
    expect(computeWinRate(trades)).toBe(0);
  });

  it('should return 0 for empty trades array', () => {
    expect(computeWinRate([])).toBe(0);
  });
});
