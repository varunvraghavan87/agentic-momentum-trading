import type { AppConfig } from '../config/index';
import type { IBroker } from './types';
import { KiteClient } from './kite-client';
import { PaperBroker } from './paper-broker';

export function createBroker(config: AppConfig): IBroker {
  if (config.TRADING_MODE === 'live') {
    return new KiteClient(config.KITE_API_KEY, config.KITE_API_SECRET);
  }
  return new PaperBroker();
}

export { KiteClient } from './kite-client';
export { PaperBroker } from './paper-broker';
export { TokenBucketRateLimiter } from './rate-limiter';
export type { IBroker, BrokerPositions, BrokerQuote, KiteAuthSession } from './types';
