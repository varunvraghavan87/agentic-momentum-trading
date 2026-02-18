import { eq, and, gte, lte, asc } from 'drizzle-orm';
import type { DrizzleDB } from '../db/client';
import { marketData, backtestRuns } from '../db/schema';
import { logger } from '../utils/logger';
import { computeCAGR, computeSharpeRatio, computeMaxDrawdown, computeWinRate } from './metrics';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface BacktestConfig {
  name: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
}

export interface BacktestTrade {
  symbol: string;
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  shares: number;
  pnl: number;
}

export interface BacktestResult {
  finalEquity: number;
  cagr: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  trades: BacktestTrade[];
  equityCurve: { date: string; equity: number }[];
}

/* ------------------------------------------------------------------ */
/*  Engine                                                            */
/* ------------------------------------------------------------------ */

export class BacktestEngine {
  private db: DrizzleDB;

  constructor(db: DrizzleDB) {
    this.db = db;
  }

  /**
   * Run a backtest over the configured date range.
   *
   * This is a working skeleton: it fetches historical OHLCV data,
   * iterates through trading days, maintains an equity curve and
   * computes performance metrics.  The actual entry / exit strategy
   * logic is intentionally simplified and can be fleshed out later.
   */
  async run(config: BacktestConfig): Promise<BacktestResult> {
    logger.info({ config }, 'Starting backtest');

    // ---- 1. Fetch historical market data from DB -----------------
    const rows = await this.db
      .select()
      .from(marketData)
      .where(
        and(
          gte(marketData.timestamp, config.startDate),
          lte(marketData.timestamp, config.endDate),
          eq(marketData.interval, 'day'),
        ),
      )
      .orderBy(asc(marketData.timestamp));

    // Group bars by date
    const barsByDate = new Map<string, typeof rows>();
    for (const row of rows) {
      const date = row.timestamp.split('T')[0];
      if (!barsByDate.has(date)) {
        barsByDate.set(date, []);
      }
      barsByDate.get(date)!.push(row);
    }

    const tradingDays = [...barsByDate.keys()].sort();

    // ---- 2. Iterate through trading days -------------------------
    let equity = config.initialCapital;
    const equityCurve: { date: string; equity: number }[] = [];
    const closedTrades: BacktestTrade[] = [];
    const openPositions: Map<string, BacktestTrade> = new Map();

    for (const date of tradingDays) {
      const bars = barsByDate.get(date)!;

      // --- Exit logic (simplified: close positions hitting basic rules) ---
      for (const [symbol, position] of openPositions) {
        const bar = bars.find(b => b.tradingsymbol === symbol);
        if (!bar) continue;

        // Placeholder exit rule: close after holding (will be replaced
        // with stop-loss / target logic later)
        const holdingDays = tradingDays.indexOf(date) - tradingDays.indexOf(position.entryDate);
        if (holdingDays >= 5) {
          const pnl = (bar.close - position.entryPrice) * position.shares;
          closedTrades.push({
            ...position,
            exitDate: date,
            exitPrice: bar.close,
            pnl,
          });
          equity += pnl;
          openPositions.delete(symbol);
        }
      }

      // --- Entry logic (simplified rule-based screening, no LLM) ---
      if (openPositions.size < 5) {
        for (const bar of bars) {
          if (openPositions.has(bar.tradingsymbol)) continue;
          if (openPositions.size >= 5) break;

          // Placeholder entry rule: buy if close > open (basic momentum)
          if (bar.close > bar.open && bar.volume > 0) {
            const riskPerTrade = equity * 0.02; // 2% risk per trade
            const shares = Math.floor(riskPerTrade / bar.close);
            if (shares <= 0) continue;

            const trade: BacktestTrade = {
              symbol: bar.tradingsymbol,
              entryDate: date,
              entryPrice: bar.close,
              shares,
              pnl: 0,
            };
            openPositions.set(bar.tradingsymbol, trade);
          }
        }
      }

      // --- Record equity at end of day ---
      let unrealisedPnl = 0;
      for (const [symbol, position] of openPositions) {
        const bar = bars.find(b => b.tradingsymbol === symbol);
        if (bar) {
          unrealisedPnl += (bar.close - position.entryPrice) * position.shares;
        }
      }

      equityCurve.push({ date, equity: equity + unrealisedPnl });
    }

    // ---- 3. Force-close remaining open positions -----------------
    const lastDate = tradingDays[tradingDays.length - 1];
    const lastBars = lastDate ? barsByDate.get(lastDate) ?? [] : [];
    for (const [symbol, position] of openPositions) {
      const bar = lastBars.find(b => b.tradingsymbol === symbol);
      const exitPrice = bar?.close ?? position.entryPrice;
      const pnl = (exitPrice - position.entryPrice) * position.shares;
      closedTrades.push({
        ...position,
        exitDate: lastDate,
        exitPrice,
        pnl,
      });
      equity += pnl;
    }

    // ---- 4. Compute performance metrics --------------------------
    const equityValues = equityCurve.map(e => e.equity);
    const dailyReturns: number[] = [];
    for (let i = 1; i < equityValues.length; i++) {
      dailyReturns.push((equityValues[i] - equityValues[i - 1]) / equityValues[i - 1]);
    }

    const years =
      tradingDays.length > 0
        ? (new Date(tradingDays[tradingDays.length - 1]).getTime() - new Date(tradingDays[0]).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
        : 1;

    const finalEquity = equityValues.length > 0 ? equityValues[equityValues.length - 1] : config.initialCapital;

    const result: BacktestResult = {
      finalEquity,
      cagr: computeCAGR(config.initialCapital, finalEquity, years || 1),
      sharpeRatio: computeSharpeRatio(dailyReturns),
      maxDrawdown: computeMaxDrawdown(equityValues),
      winRate: computeWinRate(
        closedTrades
          .filter(t => t.exitPrice !== undefined)
          .map(t => ({ entryPrice: t.entryPrice, exitPrice: t.exitPrice! })),
      ),
      totalTrades: closedTrades.length,
      trades: closedTrades,
      equityCurve,
    };

    // ---- 5. Persist run to backtestRuns table --------------------
    await this.db.insert(backtestRuns).values({
      name: config.name,
      startDate: config.startDate,
      endDate: config.endDate,
      initialCapital: config.initialCapital,
      finalEquity: result.finalEquity,
      cagr: result.cagr,
      sharpeRatio: result.sharpeRatio,
      maxDrawdown: result.maxDrawdown,
      winRate: result.winRate,
      totalTrades: result.totalTrades,
      config: JSON.stringify(config),
      results: JSON.stringify({ trades: result.trades, equityCurve: result.equityCurve }),
      createdAt: new Date().toISOString(),
    });

    logger.info(
      {
        name: config.name,
        finalEquity: result.finalEquity,
        cagr: result.cagr,
        sharpe: result.sharpeRatio,
        maxDD: result.maxDrawdown,
        winRate: result.winRate,
        trades: result.totalTrades,
      },
      'Backtest completed',
    );

    return result;
  }
}
