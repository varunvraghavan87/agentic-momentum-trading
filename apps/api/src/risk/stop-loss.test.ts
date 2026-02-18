import { TrailingStopManager } from './stop-loss.js';

const makePosition = (overrides = {}) => ({
  averageEntry: 100,
  stopLoss: 90,
  target: 130,
  trailingStopActive: false,
  trailingStopPrice: undefined as number | undefined,
  ...overrides,
});

describe('TrailingStopManager', () => {
  const manager = new TrailingStopManager();

  it('should hold when price is between stop and entry', () => {
    const position = makePosition();
    const result = manager.evaluateStop(position, 95, 92);
    expect(result.action).toBe('hold');
  });

  it('should exit on stop loss hit', () => {
    const position = makePosition();
    const result = manager.evaluateStop(position, 89, 85);
    expect(result.action).toBe('exit');
    expect(result.reason).toContain('Stop loss');
  });

  it('should exit on target reached', () => {
    const position = makePosition();
    const result = manager.evaluateStop(position, 131, 120);
    expect(result.action).toBe('exit');
    expect(result.reason).toContain('Target');
  });

  it('should activate trailing stop when price >= entry * 1.05 (Stage 1)', () => {
    const position = makePosition();
    // price = 106 >= 100 * 1.05 = 105
    const result = manager.evaluateStop(position, 106, 102);
    expect(result.action).toBe('move_stop');
    expect(result.newStopPrice).toBe(100); // entry (breakeven)
    expect(result.activateTrailing).toBe(true);
  });

  it('should trail stop to EMA20 when trailing active and ema20 > trailing stop (Stage 2)', () => {
    const position = makePosition({
      trailingStopActive: true,
      trailingStopPrice: 100,
    });
    const result = manager.evaluateStop(position, 115, 108);
    expect(result.action).toBe('move_stop');
    expect(result.newStopPrice).toBe(108);
  });

  it('should exit when trailing stop is hit', () => {
    const position = makePosition({
      trailingStopActive: true,
      trailingStopPrice: 105,
    });
    // price=104 <= trailingStopPrice=105, ema20=103 < trailingStopPrice=105
    // Since ema20 (103) is NOT > effectiveStop (105), Stage 2 doesn't trigger.
    // Then check exit: price (104) <= effectiveStop (105) => exit
    const result = manager.evaluateStop(position, 104, 103);
    expect(result.action).toBe('exit');
  });
});
