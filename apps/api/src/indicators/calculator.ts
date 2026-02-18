import { EMA, RSI, ADX, ATR, bullishengulfingpattern, bullishhammerstick } from 'technicalindicators';
import type { ADXOutput } from 'technicalindicators';

export class IndicatorCalculator {
  computeEMA(closes: number[], period: number): number[] {
    return EMA.calculate({ period, values: closes });
  }

  computeRSI(closes: number[], period: number = 14): number[] {
    return RSI.calculate({ period, values: closes });
  }

  computeADX(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
    const results: ADXOutput[] = ADX.calculate({ period, high: highs, low: lows, close: closes });
    return results.map((r) => r.adx);
  }

  computeATR(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
    return ATR.calculate({ period, high: highs, low: lows, close: closes });
  }

  detectPatterns(open: number[], high: number[], low: number[], close: number[]): string[] {
    const detected: string[] = [];

    if (bullishengulfingpattern({ open, high, low, close })) {
      detected.push('bullishengulfingpattern');
    }

    if (bullishhammerstick({ open, high, low, close })) {
      detected.push('bullishhammerstick');
    }

    return detected;
  }
}
