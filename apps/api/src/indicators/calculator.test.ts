import { IndicatorCalculator } from './calculator';

describe('IndicatorCalculator', () => {
  let calc: IndicatorCalculator;

  beforeEach(() => {
    calc = new IndicatorCalculator();
  });

  describe('computeEMA', () => {
    it('should return correct length and positive values for period 5', () => {
      const closes = [22, 24, 23, 25, 26, 28, 27, 29, 30, 28];
      const result = calc.computeEMA(closes, 5);

      // EMA output length = closes.length - period + 1
      expect(result).toHaveLength(closes.length - 5 + 1);
      result.forEach((val) => {
        expect(val).toBeGreaterThan(0);
      });
    });

    it('should return values in a reasonable range around the input data', () => {
      const closes = [22, 24, 23, 25, 26, 28, 27, 29, 30, 28];
      const result = calc.computeEMA(closes, 5);

      result.forEach((val) => {
        expect(val).toBeGreaterThanOrEqual(20);
        expect(val).toBeLessThanOrEqual(32);
      });
    });
  });

  describe('computeRSI', () => {
    it('should return values between 0 and 100', () => {
      const closes = [
        100, 102, 101, 103, 105, 104, 106, 108, 107, 109,
        111, 110, 112, 114, 113, 115, 117, 116, 118, 120,
      ];
      const period = 14;
      const result = calc.computeRSI(closes, period);

      expect(result.length).toBe(closes.length - period);

      result.forEach((val) => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(100);
      });
    });

    it('should use default period 14 when not specified', () => {
      const closes = [
        100, 102, 101, 103, 105, 104, 106, 108, 107, 109,
        111, 110, 112, 114, 113, 115, 117, 116, 118, 120,
      ];
      const result = calc.computeRSI(closes);

      expect(result.length).toBe(closes.length - 14);
    });
  });

  describe('computeADX', () => {
    it('should return values between 0 and 100', () => {
      // ADX with period 14 needs ~2*period+1 = 29+ bars minimum
      const highs = [
        105, 107, 106, 108, 110, 109, 111, 113, 112, 114,
        116, 115, 117, 119, 118, 120, 122, 121, 123, 125,
        124, 126, 128, 127, 129, 130, 132, 131, 133, 135,
        134, 136, 138, 137, 139, 140,
      ];
      const lows = [
        95, 97, 96, 98, 100, 99, 101, 103, 102, 104,
        106, 105, 107, 109, 108, 110, 112, 111, 113, 115,
        114, 116, 118, 117, 119, 120, 122, 121, 123, 125,
        124, 126, 128, 127, 129, 130,
      ];
      const closes = [
        100, 102, 101, 103, 105, 104, 106, 108, 107, 109,
        111, 110, 112, 114, 113, 115, 117, 116, 118, 120,
        119, 121, 123, 122, 124, 125, 127, 126, 128, 130,
        129, 131, 133, 132, 134, 135,
      ];
      const result = calc.computeADX(highs, lows, closes, 14);

      expect(result.length).toBeGreaterThan(0);
      result.forEach((val) => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('computeATR', () => {
    it('should return positive values', () => {
      const highs = [
        105, 107, 106, 108, 110, 109, 111, 113, 112, 114,
        116, 115, 117, 119, 118, 120, 122, 121, 123, 125,
        124, 126, 128, 127, 129, 130,
      ];
      const lows = [
        95, 97, 96, 98, 100, 99, 101, 103, 102, 104,
        106, 105, 107, 109, 108, 110, 112, 111, 113, 115,
        114, 116, 118, 117, 119, 120,
      ];
      const closes = [
        100, 102, 101, 103, 105, 104, 106, 108, 107, 109,
        111, 110, 112, 114, 113, 115, 117, 116, 118, 120,
        119, 121, 123, 122, 124, 125,
      ];
      const result = calc.computeATR(highs, lows, closes, 14);

      expect(result.length).toBeGreaterThan(0);
      result.forEach((val) => {
        expect(val).toBeGreaterThan(0);
      });
    });
  });

  describe('detectPatterns', () => {
    it('should return an array of strings', () => {
      const open = [100, 102, 101, 103, 105];
      const high = [105, 107, 106, 108, 110];
      const low = [95, 97, 96, 98, 100];
      const close = [102, 101, 103, 105, 104];

      const result = calc.detectPatterns(open, high, low, close);

      expect(Array.isArray(result)).toBe(true);
      result.forEach((pattern) => {
        expect(typeof pattern).toBe('string');
      });
    });

    it('should return string[] even when no patterns are detected', () => {
      const open = [100, 100, 100, 100, 100];
      const high = [101, 101, 101, 101, 101];
      const low = [99, 99, 99, 99, 99];
      const close = [100, 100, 100, 100, 100];

      const result = calc.detectPatterns(open, high, low, close);

      expect(Array.isArray(result)).toBe(true);
      result.forEach((pattern) => {
        expect(typeof pattern).toBe('string');
      });
    });
  });
});
