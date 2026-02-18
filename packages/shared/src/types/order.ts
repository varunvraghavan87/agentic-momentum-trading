export type TransactionType = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
export type ProductType = 'CNC' | 'MIS' | 'NRML';
export type OrderStatus = 'OPEN' | 'COMPLETE' | 'CANCELLED' | 'REJECTED' | 'PENDING';
export type TradingMode = 'paper' | 'live';

export interface OrderParams {
  tradingsymbol: string;
  exchange: string;
  transactionType: TransactionType;
  orderType: OrderType;
  product: ProductType;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  tag?: string;
}

export interface Order {
  orderId: string;
  tradingsymbol: string;
  exchange: string;
  transactionType: TransactionType;
  orderType: OrderType;
  product: ProductType;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  status: OrderStatus;
  filledQuantity?: number;
  averagePrice?: number;
  statusMessage?: string;
  tag?: string;
  placedAt: string;
  updatedAt: string;
}

export interface Position {
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  averageEntry: number;
  currentPrice?: number;
  stopLoss: number;
  target: number;
  trailingStopActive: boolean;
  trailingStopPrice?: number;
  pnl?: number;
  pnlPercent?: number;
  mode: TradingMode;
  status: 'open' | 'closed';
  enteredAt: string;
  closedAt?: string;
}

export interface Holding {
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
}
