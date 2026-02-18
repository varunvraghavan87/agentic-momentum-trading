import type { OrderParams, Order, Holding, TradingMode } from '@amt/shared';

export interface IBroker {
  readonly mode: TradingMode;

  placeOrder(params: OrderParams): Promise<string>;
  modifyOrder(orderId: string, params: Partial<OrderParams>): Promise<string>;
  cancelOrder(orderId: string): Promise<string>;
  getOrders(): Promise<Order[]>;
  getPositions(): Promise<BrokerPositions>;
  getHoldings(): Promise<Holding[]>;
  getLTP(instruments: string[]): Promise<Record<string, { lastPrice: number }>>;
  getQuote(instruments: string[]): Promise<Record<string, BrokerQuote>>;
}

export interface BrokerPositions {
  net: BrokerPosition[];
  day: BrokerPosition[];
}

export interface BrokerPosition {
  tradingsymbol: string;
  exchange: string;
  product: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  value: number;
}

export interface BrokerQuote {
  instrumentToken: number;
  lastPrice: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  averagePrice: number;
  oiDayHigh?: number;
  oiDayLow?: number;
}

export interface KiteAuthSession {
  accessToken: string;
  publicToken: string;
  userId: string;
  loginTime: string;
}
