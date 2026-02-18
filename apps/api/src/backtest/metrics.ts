import { mean, stddev } from '../utils/math';

/**
 * Compute Compound Annual Growth Rate.
 * Formula: (finalValue / initialValue) ^ (1 / years) - 1
 */
export function computeCAGR(initialValue: number, finalValue: number, years: number): number {
  if (initialValue <= 0 || years <= 0) return 0;
  return Math.pow(finalValue / initialValue, 1 / years) - 1;
}

/**
 * Compute annualised Sharpe Ratio from daily returns.
 * Default risk-free rate: 6% annual -> 0.06/252 per day.
 * Formula: (mean excess return / std of excess returns) * sqrt(252)
 */
export function computeSharpeRatio(dailyReturns: number[], riskFreeRate: number = 0.06 / 252): number {
  if (dailyReturns.length < 2) return 0;

  const excessReturns = dailyReturns.map(r => r - riskFreeRate);
  const avgExcess = mean(excessReturns);
  const stdExcess = stddev(excessReturns);

  if (stdExcess === 0) return 0;

  return (avgExcess / stdExcess) * Math.sqrt(252);
}

/**
 * Compute maximum drawdown from an equity curve.
 * Tracks running peak and returns the largest (peak - current) / peak.
 */
export function computeMaxDrawdown(equityCurve: number[]): number {
  if (equityCurve.length === 0) return 0;

  let peak = equityCurve[0];
  let maxDD = 0;

  for (const equity of equityCurve) {
    if (equity > peak) {
      peak = equity;
    }
    const drawdown = (peak - equity) / peak;
    if (drawdown > maxDD) {
      maxDD = drawdown;
    }
  }

  return maxDD;
}

/**
 * Compute win rate as fraction of profitable trades.
 * A trade is a win if exitPrice > entryPrice.
 */
export function computeWinRate(trades: { entryPrice: number; exitPrice: number }[]): number {
  if (trades.length === 0) return 0;

  const wins = trades.filter(t => t.exitPrice > t.entryPrice).length;
  return wins / trades.length;
}
