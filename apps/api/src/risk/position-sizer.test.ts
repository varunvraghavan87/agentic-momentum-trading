import { PositionSizer } from './position-sizer.js';

describe('PositionSizer', () => {
  describe('calculate', () => {
    it('should cap shares by maxPositionPercent when position limit is binding', () => {
      const sizer = new PositionSizer(0.02, 0.08);
      // riskAmount = 1000000 * 0.02 = 20000
      // riskPerShare = 500 - 475 = 25
      // sharesByRisk = floor(20000 / 25) = 800
      // maxPositionValue = 1000000 * 0.08 = 80000
      // maxSharesByPosition = floor(80000 / 500) = 160
      // result = min(800, 160) = 160
      const result = sizer.calculate(1_000_000, 500, 475);
      expect(result).toBe(160);
    });

    it('should cap shares by maxPositionPercent when risk allows more', () => {
      const sizer = new PositionSizer(0.02, 0.08);
      // riskPerShare = 100 - 95 = 5
      // riskAmount = 1000000 * 0.02 = 20000
      // sharesByRisk = floor(20000 / 5) = 4000
      // maxPositionValue = 1000000 * 0.08 = 80000
      // maxSharesByPosition = floor(80000 / 100) = 800
      // result = min(4000, 800) = 800
      const result = sizer.calculate(1_000_000, 100, 95);
      expect(result).toBe(800);
    });

    it('should return 0 when stopLoss >= entry (invalid risk per share)', () => {
      const sizer = new PositionSizer(0.02, 0.08);
      expect(sizer.calculate(1_000_000, 100, 100)).toBe(0);
      expect(sizer.calculate(1_000_000, 100, 105)).toBe(0);
    });
  });

  describe('kellyAdjusted', () => {
    it('should cap kelly fraction at 0.25 when raw kelly exceeds cap', () => {
      const sizer = new PositionSizer(0.02, 0.08);
      // kelly = 0.6 - (0.4 / (2 / 1)) = 0.6 - 0.2 = 0.4, capped at 0.25
      const result = sizer.kellyAdjusted(0.6, 2, 1);
      expect(result).toBe(0.25);
    });

    it('should return uncapped kelly when below 0.25', () => {
      const sizer = new PositionSizer(0.02, 0.08);
      // kelly = 0.5 - (0.5 / (1.5 / 1)) = 0.5 - 0.3333 = 0.1667
      const result = sizer.kellyAdjusted(0.5, 1.5, 1);
      expect(result).toBeCloseTo(0.1667, 4);
    });

    it('should return 0 when avgLossRatio is 0', () => {
      const sizer = new PositionSizer(0.02, 0.08);
      const result = sizer.kellyAdjusted(0.6, 2, 0);
      expect(result).toBe(0);
    });

    it('should clamp negative kelly to 0', () => {
      const sizer = new PositionSizer(0.02, 0.08);
      // kelly = 0.3 - (0.7 / (1 / 1)) = 0.3 - 0.7 = -0.4, clamped to 0
      const result = sizer.kellyAdjusted(0.3, 1, 1);
      expect(result).toBe(0);
    });
  });
});
