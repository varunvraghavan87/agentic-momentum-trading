import { KiteConnect } from 'kiteconnect';
import type { OrderParams, Order, Holding } from '@amt/shared';
import type { IBroker, BrokerPositions, BrokerQuote, KiteAuthSession } from './types';
import { TokenBucketRateLimiter } from './rate-limiter';
import { TRADING_CONSTANTS } from '../config/trading';
import { logger } from '../utils/logger';

export class KiteClient implements IBroker {
  readonly mode = 'live' as const;
  private kc: KiteConnect;
  private orderLimiter: TokenBucketRateLimiter;
  private quoteLimiter: TokenBucketRateLimiter;
  private historicalLimiter: TokenBucketRateLimiter;
  private sebiLimiter: TokenBucketRateLimiter;

  constructor(
    private readonly apiKey: string,
    private readonly apiSecret: string,
  ) {
    this.kc = new KiteConnect({ api_key: apiKey });
    this.orderLimiter = new TokenBucketRateLimiter(
      TRADING_CONSTANTS.ORDER_RATE_LIMIT,
      TRADING_CONSTANTS.ORDER_RATE_LIMIT,
    );
    this.quoteLimiter = new TokenBucketRateLimiter(
      TRADING_CONSTANTS.QUOTE_RATE_LIMIT,
      TRADING_CONSTANTS.QUOTE_RATE_LIMIT,
    );
    this.historicalLimiter = new TokenBucketRateLimiter(
      TRADING_CONSTANTS.HISTORICAL_RATE_LIMIT,
      TRADING_CONSTANTS.HISTORICAL_RATE_LIMIT,
    );
    this.sebiLimiter = new TokenBucketRateLimiter(
      TRADING_CONSTANTS.MAX_ORDERS_PER_SECOND,
      TRADING_CONSTANTS.MAX_ORDERS_PER_SECOND,
    );
  }

  getLoginURL(): string {
    return this.kc.getLoginURL();
  }

  async generateSession(requestToken: string): Promise<KiteAuthSession> {
    const session = await this.kc.generateSession(requestToken, this.apiSecret);
    this.kc.setAccessToken(session.access_token);
    logger.info({ userId: session.user_id }, 'Kite session established');
    return {
      accessToken: session.access_token,
      publicToken: session.public_token,
      userId: session.user_id,
      loginTime: new Date().toISOString(),
    };
  }

  setAccessToken(token: string): void {
    this.kc.setAccessToken(token);
  }

  async getInstruments(exchange?: string): Promise<any[]> {
    await this.quoteLimiter.acquire();
    return this.kc.getInstruments(exchange);
  }

  async getHistoricalData(
    instrumentToken: number,
    fromDate: string,
    toDate: string,
    interval: string,
  ): Promise<any[]> {
    await this.historicalLimiter.acquire();
    return this.kc.getHistoricalData(
      instrumentToken,
      interval,
      fromDate,
      toDate,
    );
  }

  async placeOrder(params: OrderParams): Promise<string> {
    await this.orderLimiter.acquire();
    await this.sebiLimiter.acquire();

    const response = await this.kc.placeOrder('regular', {
      tradingsymbol: params.tradingsymbol,
      exchange: params.exchange,
      transaction_type: params.transactionType,
      order_type: params.orderType,
      product: params.product,
      quantity: params.quantity,
      price: params.price,
      trigger_price: params.triggerPrice,
      tag: params.tag || TRADING_CONSTANTS.ALGO_TAG,
    });

    logger.info({
      orderId: response.order_id,
      symbol: params.tradingsymbol,
      type: params.transactionType,
    }, 'Order placed via Kite Connect');

    return response.order_id;
  }

  async modifyOrder(orderId: string, params: Partial<OrderParams>): Promise<string> {
    await this.orderLimiter.acquire();
    const response = await this.kc.modifyOrder('regular', orderId, {
      order_type: params.orderType,
      quantity: params.quantity,
      price: params.price,
      trigger_price: params.triggerPrice,
    });
    return response.order_id;
  }

  async cancelOrder(orderId: string): Promise<string> {
    await this.orderLimiter.acquire();
    const response = await this.kc.cancelOrder('regular', orderId);
    return response.order_id;
  }

  async getOrders(): Promise<Order[]> {
    await this.quoteLimiter.acquire();
    const rawOrders = await this.kc.getOrders();
    return rawOrders.map((o: any) => ({
      orderId: o.order_id,
      tradingsymbol: o.tradingsymbol,
      exchange: o.exchange,
      transactionType: o.transaction_type,
      orderType: o.order_type,
      product: o.product,
      quantity: o.quantity,
      price: o.price,
      triggerPrice: o.trigger_price,
      status: o.status,
      filledQuantity: o.filled_quantity,
      averagePrice: o.average_price,
      statusMessage: o.status_message,
      tag: o.tag,
      placedAt: o.order_timestamp,
      updatedAt: o.exchange_update_timestamp || o.order_timestamp,
    }));
  }

  async getPositions(): Promise<BrokerPositions> {
    await this.quoteLimiter.acquire();
    const pos = await this.kc.getPositions();
    return {
      net: (pos.net || []).map(this.mapPosition),
      day: (pos.day || []).map(this.mapPosition),
    };
  }

  async getHoldings(): Promise<Holding[]> {
    await this.quoteLimiter.acquire();
    const holdings = await this.kc.getHoldings();
    return holdings.map((h: any) => ({
      tradingsymbol: h.tradingsymbol,
      exchange: h.exchange,
      quantity: h.quantity,
      averagePrice: h.average_price,
      lastPrice: h.last_price,
      pnl: h.pnl,
    }));
  }

  async getLTP(instruments: string[]): Promise<Record<string, { lastPrice: number }>> {
    await this.quoteLimiter.acquire();
    const data = await this.kc.getLTP(instruments);
    const result: Record<string, { lastPrice: number }> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = { lastPrice: (value as any).last_price };
    }
    return result;
  }

  async getQuote(instruments: string[]): Promise<Record<string, BrokerQuote>> {
    await this.quoteLimiter.acquire();
    const data = await this.kc.getQuote(instruments);
    const result: Record<string, BrokerQuote> = {};
    for (const [key, value] of Object.entries(data)) {
      const q = value as any;
      result[key] = {
        instrumentToken: q.instrument_token,
        lastPrice: q.last_price,
        open: q.ohlc?.open ?? 0,
        high: q.ohlc?.high ?? 0,
        low: q.ohlc?.low ?? 0,
        close: q.ohlc?.close ?? 0,
        volume: q.volume,
        averagePrice: q.average_price,
      };
    }
    return result;
  }

  private mapPosition(p: any) {
    return {
      tradingsymbol: p.tradingsymbol,
      exchange: p.exchange,
      product: p.product,
      quantity: p.quantity,
      averagePrice: p.average_price,
      lastPrice: p.last_price,
      pnl: p.pnl,
      value: p.value,
    };
  }
}
