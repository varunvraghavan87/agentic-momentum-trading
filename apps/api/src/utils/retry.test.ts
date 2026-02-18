import { retryWithBackoff } from './retry.js';

vi.mock('./logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('retryWithBackoff', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retryWithBackoff(fn, 'test', { initialDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds on later attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('ok');

    const result = await retryWithBackoff(fn, 'test', {
      maxRetries: 3,
      initialDelayMs: 1,
      maxDelayMs: 10,
      backoffMultiplier: 1,
    });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after all retries are exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));

    await expect(
      retryWithBackoff(fn, 'test', {
        maxRetries: 2,
        initialDelayMs: 1,
        maxDelayMs: 10,
        backoffMultiplier: 1,
      }),
    ).rejects.toThrow('always fails');

    // 1 initial attempt + 2 retries = 3 total calls
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('respects custom options', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    const start = Date.now();
    await retryWithBackoff(fn, 'test', {
      maxRetries: 1,
      initialDelayMs: 50,
      maxDelayMs: 100,
      backoffMultiplier: 2,
    });
    const elapsed = Date.now() - start;

    expect(fn).toHaveBeenCalledTimes(2);
    // Should have waited at least ~50ms for the retry delay
    expect(elapsed).toBeGreaterThanOrEqual(30);
  });
});
