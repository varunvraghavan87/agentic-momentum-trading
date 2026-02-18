import { eq, and } from 'drizzle-orm';
import type { AgentName, IndicatorAgentOutput } from '@amt/shared';
import type { IndicatorCalculator } from '../indicators/calculator';
import type { DrizzleDB } from '../db/client';
import type { AgentBus } from './agent-bus';
import { BaseAgent } from './base-agent';
import { instruments, marketData } from '../db/schema';
import { computeIndicatorSnapshot } from '../indicators/snapshot';
import { logger } from '../utils/logger';

interface IndicatorAgentInput {
  date: string;
}

/**
 * Stage 2 -- Indicator computation.
 *
 * Reads all NSE instruments from the DB, pulls their persisted OHLCV
 * from the `market_data` table, computes a full indicator snapshot
 * (EMA-20/50/200, RSI-14, ADX-14, ATR-14, volume ratio, weekly return,
 * candlestick patterns), and publishes a summary to the AgentBus
 * "indicators" stage.
 */
export class IndicatorAgent extends BaseAgent {
  readonly name: AgentName = 'IndicatorAgent';

  constructor(
    private readonly calculator: IndicatorCalculator,
    private readonly db: DrizzleDB,
    private readonly bus: AgentBus,
    private readonly marketDataService: {
      fetchEOD: (token: number, from: string, to: string) => Promise<any[]>;
    },
  ) {
    super();
  }

  protected async run(input: unknown): Promise<IndicatorAgentOutput> {
    const { date } = input as IndicatorAgentInput;

    // 1. Get all tracked instruments from the DB
    const allInstruments = await this.db
      .select()
      .from(instruments)
      .where(eq(instruments.isNifty500, true));

    logger.info(
      { count: allInstruments.length },
      'IndicatorAgent: instruments loaded from DB',
    );

    const processedSymbols: string[] = [];

    // 2. For each instrument, read OHLCV from market_data table and compute snapshot
    for (const inst of allInstruments) {
      try {
        const ohlcvRows = await this.db
          .select({
            open: marketData.open,
            high: marketData.high,
            low: marketData.low,
            close: marketData.close,
            volume: marketData.volume,
          })
          .from(marketData)
          .where(
            and(
              eq(marketData.tradingsymbol, inst.tradingsymbol),
              eq(marketData.interval, 'day'),
            ),
          )
          .orderBy(marketData.timestamp);

        if (ohlcvRows.length < 50) {
          logger.debug(
            { symbol: inst.tradingsymbol, bars: ohlcvRows.length },
            'IndicatorAgent: insufficient OHLCV data, skipping',
          );
          continue;
        }

        await computeIndicatorSnapshot(inst.tradingsymbol, ohlcvRows, this.db);
        processedSymbols.push(inst.tradingsymbol);
      } catch (err) {
        logger.error(
          { symbol: inst.tradingsymbol, err },
          'IndicatorAgent: failed to compute indicators',
        );
      }
    }

    // 3. Publish to AgentBus
    const output: IndicatorAgentOutput = {
      date,
      snapshotCount: processedSymbols.length,
      symbols: processedSymbols,
    };

    await this.bus.publishResult('indicators', date, output);
    logger.info(
      { date, snapshotCount: processedSymbols.length },
      'IndicatorAgent: indicators stage published',
    );

    return output;
  }
}
