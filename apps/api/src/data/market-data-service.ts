import { eq, and, gte, lte } from 'drizzle-orm';
import type { KiteClient } from '../broker/kite-client';
import { getDb } from '../db/client';
import { marketData } from '../db/schema';
import { TokenBucketRateLimiter } from '../broker/rate-limiter';
import { logger } from '../utils/logger';
import type { OHLCV, Instrument } from '@amt/shared';

/**
 * Fetch historical OHLCV data from Kite Connect and persist to the marketData table.
 */
export async function fetchHistoricalData(
  kite: KiteClient,
  instrumentToken: number,
  tradingsymbol: string,
  fromDate: string,
  toDate: string,
  interval: string,
): Promise<number> {
  const raw = await kite.getHistoricalData(instrumentToken, fromDate, toDate, interval);

  if (!raw || raw.length === 0) {
    logger.debug({ tradingsymbol, fromDate, toDate, interval }, 'No historical data returned');
    return 0;
  }

  const db = getDb();
  const rows = raw.map((candle: any) => ({
    instrumentToken,
    tradingsymbol,
    timestamp: Array.isArray(candle) ? candle[0] : candle.date,
    open: Array.isArray(candle) ? candle[1] : candle.open,
    high: Array.isArray(candle) ? candle[2] : candle.high,
    low: Array.isArray(candle) ? candle[3] : candle.low,
    close: Array.isArray(candle) ? candle[4] : candle.close,
    volume: Array.isArray(candle) ? candle[5] : candle.volume,
    oi: Array.isArray(candle) ? (candle[6] ?? null) : (candle.oi ?? null),
    interval,
  }));

  // Insert in batches of 500 to avoid SQLite variable limits
  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db.insert(marketData).values(batch);
  }

  logger.info(
    { tradingsymbol, interval, candles: rows.length, fromDate, toDate },
    'Historical data fetched and stored',
  );

  return rows.length;
}

/**
 * Query persisted OHLCV data from the database.
 */
export async function getOHLCV(
  tradingsymbol: string,
  fromDate: string,
  toDate: string,
  interval: string,
): Promise<OHLCV[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(marketData)
    .where(
      and(
        eq(marketData.tradingsymbol, tradingsymbol),
        eq(marketData.interval, interval),
        gte(marketData.timestamp, fromDate),
        lte(marketData.timestamp, toDate),
      ),
    )
    .orderBy(marketData.timestamp);

  return rows.map((r) => ({
    timestamp: r.timestamp,
    open: r.open,
    high: r.high,
    low: r.low,
    close: r.close,
    volume: r.volume,
    oi: r.oi ?? undefined,
  }));
}

/**
 * Batch-fetch the latest day's OHLCV data for all instruments.
 * Uses rate limiting with ~333ms delay between calls to stay within
 * Kite Connect's historical data API limits (3 req/s).
 */
export async function fetchDailyUpdateForAll(
  kite: KiteClient,
  instrumentList: Instrument[],
  date: string,
): Promise<{ success: number; failed: number }> {
  const limiter = new TokenBucketRateLimiter(3, 3);
  let success = 0;
  let failed = 0;

  logger.info(
    { instruments: instrumentList.length, date },
    'Starting daily OHLCV batch update',
  );

  for (const inst of instrumentList) {
    try {
      await limiter.acquire();
      await fetchHistoricalData(
        kite,
        inst.instrumentToken,
        inst.tradingsymbol,
        date,
        date,
        'day',
      );
      success++;

      // Additional throttle to maintain ~3 req/s ceiling
      await delay(333);
    } catch (err) {
      failed++;
      logger.warn(
        { tradingsymbol: inst.tradingsymbol, error: (err as Error).message },
        'Failed to fetch daily data for instrument',
      );
    }
  }

  logger.info({ success, failed, date }, 'Daily OHLCV batch update complete');
  return { success, failed };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
