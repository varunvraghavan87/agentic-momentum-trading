export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly maxTokens: number,
    private readonly refillRate: number,
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    this.refill();
    this.tokens -= 1;
  }

  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }
}
