import type { AppConfig } from '../config/index.js';
import type { IBroker } from './types.js';
import { KiteClient } from './kite-client.js';
import { PaperBroker } from './paper-broker.js';

export function createBroker(config: AppConfig): IBroker {
  if (config.TRADING_MODE === 'live') {
    return new KiteClient(config.KITE_API_KEY, config.KITE_API_SECRET);
  }
  return new PaperBroker();
}

export { KiteClient } from './kite-client.js';
export { PaperBroker } from './paper-broker.js';
export { TokenBucketRateLimiter } from './rate-limiter.js';
export type { IBroker, BrokerPositions, BrokerQuote, KiteAuthSession } from './types.js';
