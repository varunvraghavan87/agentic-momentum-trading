import { round, percentChange, mean, stddev } from './math.js';

describe('round', () => {
  it('rounds to specified decimal places', () => {
    expect(round(1.2345, 2)).toBe(1.23);
  });

  it('rounds 1.5 to 0 decimals', () => {
    expect(round(1.5, 0)).toBe(2);
  });

  it('rounds negative numbers correctly', () => {
    expect(round(-1.235, 2)).toBe(-1.24);
  });
});

describe('percentChange', () => {
  it('calculates positive percent change', () => {
    expect(percentChange(100, 110)).toBe(0.1);
  });

  it('calculates negative percent change', () => {
    expect(percentChange(100, 90)).toBe(-0.1);
  });

  it('returns 0 when from is 0', () => {
    expect(percentChange(0, 100)).toBe(0);
  });
});

describe('mean', () => {
  it('calculates the mean of an array', () => {
    expect(mean([1, 2, 3])).toBe(2);
  });

  it('returns 0 for an empty array', () => {
    expect(mean([])).toBe(0);
  });

  it('returns the value for a single-element array', () => {
    expect(mean([5])).toBe(5);
  });
});

describe('stddev', () => {
  it('calculates the population standard deviation', () => {
    expect(stddev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.0, 1);
  });

  it('returns 0 for an empty array', () => {
    expect(stddev([])).toBe(0);
  });

  it('returns 0 for a single-element array', () => {
    expect(stddev([5])).toBe(0);
  });
});
