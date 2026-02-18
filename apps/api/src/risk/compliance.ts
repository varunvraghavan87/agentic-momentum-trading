import type { OrderParams } from '@amt/shared';
import { TokenBucketRateLimiter } from '../broker/rate-limiter.js';

export class SEBICompliance {
  private readonly rateLimiter: TokenBucketRateLimiter;

  constructor() {
    // SEBI mandates max 8 orders per second for algorithmic trading
    this.rateLimiter = new TokenBucketRateLimiter(8, 8);
  }

  /**
   * Returns the unique algo identifier tag for SEBI compliance.
   */
  getAlgoTag(): string {
    return 'AMT001';
  }

  /**
   * Throttle order placement to stay within SEBI rate limits.
   * Acquires a token from the rate limiter, waiting if necessary.
   */
  async throttle(): Promise<void> {
    await this.rateLimiter.acquire();
  }

  /**
   * Basic order validation: quantity > 0, price > 0 for LIMIT orders.
   */
  validateOrder(params: OrderParams): { valid: boolean; reason?: string } {
    if (params.quantity <= 0) {
      return { valid: false, reason: 'Quantity must be greater than 0' };
    }

    if (params.orderType === 'LIMIT' && (params.price == null || params.price <= 0)) {
      return { valid: false, reason: 'Price must be greater than 0 for LIMIT orders' };
    }

    return { valid: true };
  }
}
