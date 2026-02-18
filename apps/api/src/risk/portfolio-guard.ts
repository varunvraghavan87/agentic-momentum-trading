import { desc } from 'drizzle-orm';
import type { DrizzleDB } from '../db/client.js';
import { portfolioSnapshots } from '../db/schema.js';
import type { AppConfig } from '../config/index.js';
import type { PortfolioState } from '@amt/shared';

export class PortfolioGuard {
  private manualKillSwitch = false;

  constructor(
    private readonly db: DrizzleDB,
    private readonly config: AppConfig,
  ) {}

  /**
   * Reads the latest portfolio snapshot from the DB and returns portfolio state.
   */
  async getPortfolioState(): Promise<PortfolioState> {
    const rows = await this.db
      .select()
      .from(portfolioSnapshots)
      .orderBy(desc(portfolioSnapshots.date))
      .limit(1);

    if (rows.length === 0) {
      return {
        equity: 0,
        peakEquity: 0,
        dailyPnl: 0,
        dailyPnlPercent: 0,
        drawdown: 0,
        drawdownPercent: 0,
        openPositionCount: 0,
        killSwitchActive: this.manualKillSwitch,
      };
    }

    const snapshot = rows[0];
    const killSwitch = await this.checkKillSwitch();

    return {
      equity: snapshot.totalEquity,
      peakEquity: snapshot.peakEquity,
      dailyPnl: snapshot.dailyPnl,
      dailyPnlPercent: snapshot.dailyPnlPercent,
      drawdown: snapshot.drawdown,
      drawdownPercent: snapshot.drawdownPercent,
      openPositionCount: snapshot.openPositions,
      killSwitchActive: killSwitch.active,
    };
  }

  /**
   * Checks whether the kill switch should be active.
   * Triggers on 15% max drawdown or 3% daily loss limit.
   */
  async checkKillSwitch(): Promise<{ active: boolean; reason?: string }> {
    if (this.manualKillSwitch) {
      return { active: true, reason: 'Manual kill switch activated' };
    }

    const rows = await this.db
      .select()
      .from(portfolioSnapshots)
      .orderBy(desc(portfolioSnapshots.date))
      .limit(1);

    if (rows.length === 0) {
      return { active: false };
    }

    const snapshot = rows[0];
    const maxDrawdown = this.config.MAX_PORTFOLIO_DRAWDOWN;
    const dailyLossLimit = this.config.DAILY_LOSS_LIMIT;

    if (snapshot.drawdownPercent >= maxDrawdown) {
      return {
        active: true,
        reason: `Portfolio drawdown ${(snapshot.drawdownPercent * 100).toFixed(1)}% exceeds max ${(maxDrawdown * 100).toFixed(1)}%`,
      };
    }

    if (Math.abs(snapshot.dailyPnlPercent) >= dailyLossLimit && snapshot.dailyPnl < 0) {
      return {
        active: true,
        reason: `Daily loss ${(Math.abs(snapshot.dailyPnlPercent) * 100).toFixed(1)}% exceeds limit ${(dailyLossLimit * 100).toFixed(1)}%`,
      };
    }

    return { active: false };
  }

  /**
   * Manually activate the kill switch.
   */
  activateManualKillSwitch(): void {
    this.manualKillSwitch = true;
  }

  /**
   * Manually deactivate the kill switch.
   */
  deactivateManualKillSwitch(): void {
    this.manualKillSwitch = false;
  }
}
