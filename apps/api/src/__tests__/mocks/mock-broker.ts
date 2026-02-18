import type { OrderParams, Order, Holding, TradingMode } from '@amt/shared';
import type { IBroker, BrokerPositions, BrokerQuote } from '../../broker/types';

/**
 * Mock broker for testing. Stores placed orders in memory
 * and returns configurable LTP prices.
 */
export class MockBroker implements IBroker {
  readonly mode: TradingMode = 'paper';

  /** All orders placed through this mock */
  placedOrders: Order[] = [];

  /** Internal counter for generating order IDs */
  private orderCounter = 0;

  /** Map of instrument -> last traded price */
  private ltpMap: Record<string, number>;

  constructor(ltpMap: Record<string, number> = {}) {
    this.ltpMap = ltpMap;
  }

  async placeOrder(params: OrderParams): Promise<string> {
    this.orderCounter++;
    const orderId = `MOCK-ORD-${this.orderCounter}`;
    const now = new Date().toISOString();

    const order: Order = {
      orderId,
      tradingsymbol: params.tradingsymbol,
      exchange: params.exchange,
      transactionType: params.transactionType,
      orderType: params.orderType,
      product: params.product,
      quantity: params.quantity,
      price: params.price,
      triggerPrice: params.triggerPrice,
      status: 'COMPLETE',
      filledQuantity: params.quantity,
      averagePrice: params.price ?? this.ltpMap[params.tradingsymbol] ?? 0,
      tag: params.tag,
      placedAt: now,
      updatedAt: now,
    };

    this.placedOrders.push(order);
    return orderId;
  }

  async modifyOrder(
    orderId: string,
    params: Partial<OrderParams>
  ): Promise<string> {
    const order = this.placedOrders.find((o) => o.orderId === orderId);
    if (order) {
      if (params.quantity !== undefined) order.quantity = params.quantity;
      if (params.price !== undefined) order.price = params.price;
      if (params.triggerPrice !== undefined)
        order.triggerPrice = params.triggerPrice;
      if (params.orderType !== undefined) order.orderType = params.orderType;
      order.updatedAt = new Date().toISOString();
    }
    return orderId;
  }

  async cancelOrder(orderId: string): Promise<string> {
    const order = this.placedOrders.find((o) => o.orderId === orderId);
    if (order) {
      order.status = 'CANCELLED';
      order.updatedAt = new Date().toISOString();
    }
    return orderId;
  }

  async getOrders(): Promise<Order[]> {
    return [...this.placedOrders];
  }

  async getPositions(): Promise<BrokerPositions> {
    return { net: [], day: [] };
  }

  async getHoldings(): Promise<Holding[]> {
    return [];
  }

  async getLTP(
    instruments: string[]
  ): Promise<Record<string, { lastPrice: number }>> {
    const result: Record<string, { lastPrice: number }> = {};
    for (const instrument of instruments) {
      // Support both "EXCHANGE:SYMBOL" and plain symbol lookups
      const symbol = instrument.includes(':')
        ? instrument.split(':')[1]
        : instrument;
      const price = this.ltpMap[instrument] ?? this.ltpMap[symbol] ?? 0;
      result[instrument] = { lastPrice: price };
    }
    return result;
  }

  async getQuote(
    instruments: string[]
  ): Promise<Record<string, BrokerQuote>> {
    const result: Record<string, BrokerQuote> = {};
    for (const instrument of instruments) {
      const symbol = instrument.includes(':')
        ? instrument.split(':')[1]
        : instrument;
      const price = this.ltpMap[instrument] ?? this.ltpMap[symbol] ?? 0;
      result[instrument] = {
        instrumentToken: 0,
        lastPrice: price,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 0,
        averagePrice: price,
      };
    }
    return result;
  }

  /** Reset all state for a fresh test */
  reset(): void {
    this.placedOrders = [];
    this.orderCounter = 0;
  }

  /** Update the LTP map with new prices */
  setLTP(ltpMap: Record<string, number>): void {
    this.ltpMap = { ...this.ltpMap, ...ltpMap };
  }
}
