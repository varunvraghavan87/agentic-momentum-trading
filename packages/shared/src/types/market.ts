export interface OHLCV {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  oi?: number;
}

export interface Instrument {
  instrumentToken: number;
  exchangeToken: number;
  tradingsymbol: string;
  name: string;
  exchange: 'NSE' | 'BSE' | 'NFO' | 'MCX';
  segment: string;
  instrumentType: string;
  lotSize: number;
  tickSize: number;
  isNifty500?: boolean;
  sector?: string;
  marketCap?: number;
  isASM?: boolean;
  isGSM?: boolean;
}

export interface Quote {
  instrumentToken: number;
  tradingsymbol: string;
  lastPrice: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  buyQuantity: number;
  sellQuantity: number;
  ohlc: { open: number; high: number; low: number; close: number };
  change: number;
  lastTradeTime?: string;
}

export interface Tick {
  instrumentToken: number;
  tradingsymbol?: string;
  lastPrice: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
  change?: number;
  timestamp?: Date;
}
