import { logger } from './logger.js';

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  label: string,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt > opts.maxRetries) {
        logger.error({ label, attempt, error: err }, 'All retry attempts exhausted');
        throw err;
      }

      logger.warn({ label, attempt, delay, error: err }, 'Retrying after failure');
      await sleep(delay);
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw new Error('Unreachable');
}
