import type { AgentName, DataAgentOutput, Instrument } from '@amt/shared';
import type { KiteClient } from '../broker/kite-client';
import type { AgentBus } from './agent-bus';
import { BaseAgent } from './base-agent';
import { getNifty500 } from '../data/instrument-service';
import { getDb } from '../db/client';
import { marketData } from '../db/schema';
import { subtractDays } from '../utils/date';
import { TRADING_CONSTANTS } from '../config/trading';
import { logger } from '../utils/logger';

interface DataAgentInput {
  date: string;
}

/**
 * Stage 1 -- Data ingestion.
 *
 * Fetches the Nifty 500 constituent list and pulls end-of-day OHLCV
 * for each instrument via Kite Connect historical-data API, persisting
 * results into the `market_data` table and publishing a summary to the
 * AgentBus "raw" stage.
 */
export class DataAgent extends BaseAgent {
  readonly name: AgentName = 'DataAgent';

  constructor(
    private readonly instrumentService: typeof import('../data/instrument-service.js'),
    private readonly marketDataService: {
      fetchEOD: (token: number, from: string, to: string) => Promise<any[]>;
    },
    private readonly bus: AgentBus,
    private readonly kiteClient: KiteClient,
  ) {
    super();
  }

  protected async run(input: unknown): Promise<DataAgentOutput> {
    const { date } = input as DataAgentInput;
    const db = getDb();

    // 1. Get Nifty 500 universe
    const nifty500 = await this.instrumentService.getNifty500();
    logger.info({ count: nifty500.length }, 'DataAgent: Nifty 500 list loaded');

    const fromDate = subtractDays(date, TRADING_CONSTANTS.MIN_HISTORY_DAYS);
    const symbols: string[] = [];

    // 2. Fetch EOD OHLCV for each instrument
    for (const inst of nifty500) {
      try {
        const candles = await this.marketDataService.fetchEOD(
          inst.instrumentToken,
          fromDate,
          date,
        );

        if (candles.length === 0) {
          logger.warn({ symbol: inst.tradingsymbol }, 'DataAgent: no candles returned');
          continue;
        }

        // Persist to market_data table
        for (const c of candles) {
          await db
            .insert(marketData)
            .values({
              instrumentToken: inst.instrumentToken,
              tradingsymbol: inst.tradingsymbol,
              timestamp: c.date ?? c.timestamp,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
              volume: c.volume,
              oi: c.oi ?? null,
              interval: 'day',
            })
            .onConflictDoNothing();
        }

        symbols.push(inst.tradingsymbol);
      } catch (err) {
        logger.error(
          { symbol: inst.tradingsymbol, err },
          'DataAgent: failed to fetch EOD data',
        );
      }
    }

    // 3. Publish to AgentBus
    const output: DataAgentOutput = {
      date,
      instrumentCount: symbols.length,
      ohlcvSymbols: symbols,
    };

    await this.bus.publishResult('raw', date, output);
    logger.info({ date, instrumentCount: symbols.length }, 'DataAgent: raw stage published');

    return output;
  }
}
