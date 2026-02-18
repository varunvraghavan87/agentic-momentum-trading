export class PositionSizer {
  constructor(
    private readonly riskPercent: number,
    private readonly maxPositionPercent: number,
  ) {}

  /**
   * Calculate position size using fixed fractional method.
   * shares = floor((equity * riskPercent) / riskPerShare), capped by maxPositionPercent.
   */
  calculate(equity: number, entry: number, stopLoss: number): number {
    const riskPerShare = entry - stopLoss;

    if (riskPerShare <= 0) {
      return 0;
    }

    const riskAmount = equity * this.riskPercent;
    const sharesByRisk = Math.floor(riskAmount / riskPerShare);

    const maxPositionValue = equity * this.maxPositionPercent;
    const maxSharesByPosition = Math.floor(maxPositionValue / entry);

    return Math.min(sharesByRisk, maxSharesByPosition);
  }

  /**
   * Returns Kelly fraction, capped at 0.25.
   * Kelly% = winRate - ((1 - winRate) / (avgWinRatio / avgLossRatio))
   */
  kellyAdjusted(winRate: number, avgWinRatio: number, avgLossRatio: number): number {
    if (avgLossRatio === 0) {
      return 0;
    }

    const winLossRatio = avgWinRatio / avgLossRatio;
    const kelly = winRate - (1 - winRate) / winLossRatio;

    return Math.min(Math.max(kelly, 0), 0.25);
  }
}
