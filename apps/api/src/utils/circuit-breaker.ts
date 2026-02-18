import { logger } from './logger';

export type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: CircuitState = 'closed';

  constructor(
    private readonly name: string,
    private readonly maxFailures: number = 3,
    private readonly resetTimeMs: number = 60000,
  ) {}

  getState(): CircuitState {
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeMs) {
        this.state = 'half-open';
        logger.info({ name: this.name }, 'Circuit breaker transitioning to half-open');
      } else {
        throw new Error(`Circuit breaker [${this.name}] is OPEN — halting after ${this.maxFailures} consecutive failures`);
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (err) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.maxFailures) {
        this.state = 'open';
        logger.error({ name: this.name, failures: this.failureCount }, 'Circuit breaker OPENED');
      }

      throw err;
    }
  }

  reset(): void {
    if (this.failureCount > 0) {
      logger.info({ name: this.name }, 'Circuit breaker reset');
    }
    this.failureCount = 0;
    this.state = 'closed';
  }
}
