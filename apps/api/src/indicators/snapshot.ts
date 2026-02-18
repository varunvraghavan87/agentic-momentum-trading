import { IndicatorCalculator } from './calculator';
import { indicatorSnapshots } from '../db/schema';
import type { DrizzleDB } from '../db/client';
import type { OHLCV } from '@amt/shared';

const calculator = new IndicatorCalculator();

export async function computeIndicatorSnapshot(
  tradingsymbol: string,
  ohlcv: { open: number; high: number; low: number; close: number; volume: number }[],
  db: DrizzleDB,
) {
  const opens = ohlcv.map((c) => c.open);
  const highs = ohlcv.map((c) => c.high);
  const lows = ohlcv.map((c) => c.low);
  const closes = ohlcv.map((c) => c.close);
  const volumes = ohlcv.map((c) => c.volume);

  // Compute indicators
  const ema20 = calculator.computeEMA(closes, 20);
  const ema50 = calculator.computeEMA(closes, 50);
  const ema200 = calculator.computeEMA(closes, 200);
  const rsi14 = calculator.computeRSI(closes, 14);
  const adx14 = calculator.computeADX(highs, lows, closes, 14);
  const atr14 = calculator.computeATR(highs, lows, closes, 14);

  // Volume ratio: last volume / mean of last 20 volumes
  const recentVolumes = volumes.slice(-20);
  const meanVolume = recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length;
  const volumeRatio = meanVolume > 0 ? volumes[volumes.length - 1] / meanVolume : 0;

  // Weekly return: (last close - close 5 bars ago) / close 5 bars ago
  const lastClose = closes[closes.length - 1];
  const close5Ago = closes.length >= 6 ? closes[closes.length - 6] : closes[0];
  const weeklyReturn = close5Ago !== 0 ? (lastClose - close5Ago) / close5Ago : 0;

  // Detect patterns on last 5 candles
  const tail5 = Math.max(0, ohlcv.length - 5);
  const patterns = calculator.detectPatterns(
    opens.slice(tail5),
    highs.slice(tail5),
    lows.slice(tail5),
    closes.slice(tail5),
  );

  // Take last value from each indicator array
  const last = (arr: number[]): number | null => (arr.length > 0 ? arr[arr.length - 1] : null);

  const snapshot = {
    tradingsymbol,
    date: new Date().toISOString().split('T')[0],
    ema20: last(ema20),
    ema50: last(ema50),
    ema200: last(ema200),
    rsi14: last(rsi14),
    adx14: last(adx14),
    atr14: last(atr14),
    weeklyReturn,
    volumeRatio,
    patterns: JSON.stringify(patterns),
    createdAt: new Date().toISOString(),
  };

  await db.insert(indicatorSnapshots).values(snapshot);

  return snapshot;
}
