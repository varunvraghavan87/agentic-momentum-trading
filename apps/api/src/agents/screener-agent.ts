import { eq, and } from 'drizzle-orm';
import type { AgentName, ScreenerOutput, ScreenerCandidate } from '@amt/shared';
import type { DrizzleDB } from '../db/client';
import type { AgentBus } from './agent-bus';
import { BaseAgent } from './base-agent';
import { instruments, indicatorSnapshots, marketData } from '../db/schema';
import { TRADING_CONSTANTS } from '../config/trading';
import { logger } from '../utils/logger';

interface ScreenerAgentInput {
  date: string;
}

/**
 * Stage 3 -- Screening.
 *
 * Reads indicator snapshots from the DB for the given date, applies
 * a two-phase filter (fundamental + technical), sorts by ADX
 * descending, and emits the top 15 candidates to the AgentBus
 * "screener" stage.
 */
export class ScreenerAgent extends BaseAgent {
  readonly name: AgentName = 'ScreenerAgent';

  constructor(
    private readonly db: DrizzleDB,
    private readonly bus: AgentBus,
    private readonly instrumentService: typeof import('../data/instrument-service.js'),
  ) {
    super();
  }

  protected async run(input: unknown): Promise<ScreenerOutput> {
    const { date } = input as ScreenerAgentInput;

    // 1. Load all indicator snapshots for the given date
    const snapshots = await this.db
      .select()
      .from(indicatorSnapshots)
      .where(eq(indicatorSnapshots.date, date));

    logger.info(
      { date, totalSnapshots: snapshots.length },
      'ScreenerAgent: indicator snapshots loaded',
    );

    // 2. Build a map of instruments for fast lookup
    const allInstruments = await this.db
      .select()
      .from(instruments)
      .where(eq(instruments.exchange, 'NSE'));

    const instrumentMap = new Map(
      allInstruments.map((inst) => [inst.tradingsymbol, inst]),
    );

    // 3. Phase 1 filter: fundamental / eligibility
    const phase1 = snapshots.filter((snap) => {
      const inst = instrumentMap.get(snap.tradingsymbol);
      if (!inst) return false;
      if (!inst.isNifty500) return false;
      if (inst.isASM || inst.isGSM) return false;
      if ((inst.marketCap ?? 0) <= TRADING_CONSTANTS.MIN_MARKET_CAP_CR) return false;
      return true;
    });

    logger.info(
      { phase1Count: phase1.length },
      'ScreenerAgent: phase 1 (fundamental) filter done',
    );

    // 4. Phase 2 filter: technical trend alignment
    const phase2 = phase1.filter((snap) => {
      const close = snap.ema20; // latest close approximated by nearest EMA; see note below
      if (snap.ema50 == null || snap.ema20 == null) return false;

      // close > ema50 -- we need last close from market_data; approximate with ema20 > ema50 check
      // The actual close is fetched below when building the candidate
      if (snap.ema20 <= snap.ema50) return false;
      if (snap.adx14 == null || snap.adx14 <= TRADING_CONSTANTS.MIN_ADX) return false;
      if (snap.rsi14 == null) return false;
      if (snap.rsi14 < TRADING_CONSTANTS.RSI_LOWER || snap.rsi14 > TRADING_CONSTANTS.RSI_UPPER) return false;

      return true;
    });

    logger.info(
      { phase2Count: phase2.length },
      'ScreenerAgent: phase 2 (technical) filter done',
    );

    // 5. Sort by ADX descending, take top 15
    phase2.sort((a, b) => (b.adx14 ?? 0) - (a.adx14 ?? 0));
    const topCandidates = phase2.slice(0, 15);

    // 6. Build ScreenerCandidate[] with full context
    const candidates: ScreenerCandidate[] = [];

    for (const snap of topCandidates) {
      const inst = instrumentMap.get(snap.tradingsymbol);
      if (!inst) continue;

      // Fetch the latest close from market_data for this symbol
      const latestBar = await this.db
        .select({ close: marketData.close })
        .from(marketData)
        .where(
          and(
            eq(marketData.tradingsymbol, snap.tradingsymbol),
            eq(marketData.interval, 'day'),
          ),
        )
        .orderBy(marketData.timestamp)
        .limit(1);

      const cmp = latestBar.length > 0 ? latestBar[0].close : (snap.ema20 ?? 0);

      // Verify close > ema50 with actual close
      if (snap.ema50 != null && cmp <= snap.ema50) continue;

      candidates.push({
        tradingsymbol: snap.tradingsymbol,
        exchange: inst.exchange,
        cmp,
        ema20: snap.ema20 ?? 0,
        ema50: snap.ema50 ?? 0,
        ema200: snap.ema200 ?? 0,
        rsi14: snap.rsi14 ?? 0,
        adx14: snap.adx14 ?? 0,
        atr14: snap.atr14 ?? 0,
        sector: inst.sector ?? 'Unknown',
        weeklyReturn: snap.weeklyReturn ?? 0,
        volumeRatio: snap.volumeRatio ?? 0,
        marketCap: inst.marketCap ?? 0,
        patterns: snap.patterns ? JSON.parse(snap.patterns) : [],
      });
    }

    // 7. Publish to AgentBus
    const output: ScreenerOutput = {
      date,
      candidateCount: candidates.length,
      candidates,
    };

    await this.bus.publishResult('screener', date, output);
    logger.info(
      { date, candidateCount: candidates.length },
      'ScreenerAgent: screener stage published',
    );

    return output;
  }
}
