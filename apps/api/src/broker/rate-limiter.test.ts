import { TokenBucketRateLimiter } from '../broker/rate-limiter.js';

describe('TokenBucketRateLimiter', () => {
  it('initializes with maxTokens', () => {
    const limiter = new TokenBucketRateLimiter(10, 1);
    expect(limiter.getAvailableTokens()).toBeCloseTo(10, 0);
  });

  it('acquire() decrements available tokens', async () => {
    const limiter = new TokenBucketRateLimiter(5, 1);
    await limiter.acquire();
    expect(limiter.getAvailableTokens()).toBeCloseTo(4, 0);
  });

  it('getAvailableTokens() returns current count', () => {
    const limiter = new TokenBucketRateLimiter(3, 1);
    expect(limiter.getAvailableTokens()).toBeCloseTo(3, 0);
  });

  it('waits when tokens are exhausted', async () => {
    // 1 token, refill rate of 10 per second (so ~100ms to refill 1 token)
    const limiter = new TokenBucketRateLimiter(1, 10);

    const start = Date.now();
    await limiter.acquire(); // Uses the 1 available token immediately
    await limiter.acquire(); // Should wait for refill
    const elapsed = Date.now() - start;

    // Second acquire should have waited some time for a token to refill
    expect(elapsed).toBeGreaterThanOrEqual(50);
  });
});
