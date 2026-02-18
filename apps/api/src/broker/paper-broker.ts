import { v4 as uuid } from 'uuid';
import type { OrderParams, Order, Holding } from '@amt/shared';
import type { IBroker, BrokerPositions, BrokerQuote } from './types';
import { getDb } from '../db/client';
import { orders as ordersTable } from '../db/schema';
import { logger } from '../utils/logger';

export class PaperBroker implements IBroker {
  readonly mode = 'paper' as const;
  private virtualLTP: Map<string, number> = new Map();

  async placeOrder(params: OrderParams): Promise<string> {
    const orderId = `PAPER-${uuid().slice(0, 8)}`;
    const db = getDb();

    const key = `${params.exchange}:${params.tradingsymbol}`;
    const currentPrice = this.virtualLTP.get(key) ?? params.price ?? 0;

    const fillPrice = params.orderType === 'MARKET'
      ? currentPrice * (params.transactionType === 'BUY' ? 1.001 : 0.999)
      : (params.price ?? currentPrice);

    const now = new Date().toISOString();

    await db.insert(ordersTable).values({
      orderId,
      tradingsymbol: params.tradingsymbol,
      exchange: params.exchange,
      transactionType: params.transactionType,
      orderType: params.orderType,
      product: params.product,
      quantity: params.quantity,
      price: fillPrice,
      triggerPrice: params.triggerPrice ?? null,
      status: params.orderType === 'SL' ? 'OPEN' : 'COMPLETE',
      mode: 'paper',
      tag: params.tag ?? null,
      filledQuantity: params.orderType === 'SL' ? 0 : params.quantity,
      averagePrice: params.orderType === 'SL' ? null : fillPrice,
      statusMessage: params.orderType === 'SL' ? 'SL order pending trigger' : 'Paper trade filled',
      placedAt: now,
      updatedAt: now,
    });

    logger.info({
      orderId,
      symbol: params.tradingsymbol,
      type: params.transactionType,
      price: fillPrice,
      qty: params.quantity,
    }, 'Paper order placed');

    return orderId;
  }

  async modifyOrder(orderId: string, _params: Partial<OrderParams>): Promise<string> {
    logger.info({ orderId }, 'Paper order modified (no-op)');
    return orderId;
  }

  async cancelOrder(orderId: string): Promise<string> {
    logger.info({ orderId }, 'Paper order cancelled');
    return orderId;
  }

  async getOrders(): Promise<Order[]> {
    return [];
  }

  async getPositions(): Promise<BrokerPositions> {
    return { net: [], day: [] };
  }

  async getHoldings(): Promise<Holding[]> {
    return [];
  }

  async getLTP(instruments: string[]): Promise<Record<string, { lastPrice: number }>> {
    const result: Record<string, { lastPrice: number }> = {};
    for (const inst of instruments) {
      const price = this.virtualLTP.get(inst) ?? 100;
      result[inst] = { lastPrice: price };
    }
    return result;
  }

  async getQuote(instruments: string[]): Promise<Record<string, BrokerQuote>> {
    const result: Record<string, BrokerQuote> = {};
    for (const inst of instruments) {
      const price = this.virtualLTP.get(inst) ?? 100;
      result[inst] = {
        instrumentToken: 0,
        lastPrice: price,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 100000,
        averagePrice: price,
      };
    }
    return result;
  }

  updateLTP(instrument: string, price: number): void {
    this.virtualLTP.set(instrument, price);
  }

  updateLTPBatch(prices: Record<string, number>): void {
    for (const [key, price] of Object.entries(prices)) {
      this.virtualLTP.set(key, price);
    }
  }
}
