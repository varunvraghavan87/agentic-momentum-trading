import type { OHLCV } from '@amt/shared';

/**
 * Generate realistic-looking OHLCV data for testing.
 * Dates go backwards from today, with each day's price derived from the previous close.
 */
export function generateOHLCV(
  _symbol: string,
  days: number,
  startPrice: number
): OHLCV[] {
  const data: OHLCV[] = [];
  let currentClose = startPrice;
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Open = previous close +/- random small % (up to 1.5%)
    const openVariation = 1 + (Math.random() - 0.5) * 0.03;
    const open = +(currentClose * openVariation).toFixed(2);

    // Close = open +/- random % (up to 2%)
    const closeVariation = 1 + (Math.random() - 0.5) * 0.04;
    const close = +(open * closeVariation).toFixed(2);

    // High = max(open, close) + random 0-2%
    const highBase = Math.max(open, close);
    const high = +(highBase * (1 + Math.random() * 0.02)).toFixed(2);

    // Low = min(open, close) - random 0-2%
    const lowBase = Math.min(open, close);
    const low = +(lowBase * (1 - Math.random() * 0.02)).toFixed(2);

    // Volume = random between 100,000 and 500,000
    const volume = Math.floor(100_000 + Math.random() * 400_000);

    data.push({
      timestamp: date.toISOString().split('T')[0] + 'T00:00:00.000Z',
      open,
      high,
      low,
      close,
      volume,
    });

    // Next iteration uses this day's close as the base
    currentClose = close;
  }

  return data;
}

/** 50-day OHLCV sample for RELIANCE starting at 2500 */
export const SAMPLE_OHLCV_50: OHLCV[] = generateOHLCV('RELIANCE', 50, 2500);

/** 250-day OHLCV sample for RELIANCE starting at 2500 */
export const SAMPLE_OHLCV_250: OHLCV[] = generateOHLCV('RELIANCE', 250, 2500);
