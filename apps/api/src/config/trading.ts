export const TRADING_CONSTANTS = {
  // Universe
  UNIVERSE: 'NIFTY_500',
  MIN_MARKET_CAP_CR: 5000,
  MIN_ADT_CR: 20,

  // Trend filters
  MIN_ADX: 25,
  RSI_LOWER: 40,
  RSI_UPPER: 70,
  RSI_OVERBOUGHT: 70,
  RSI_OVERSOLD: 40,

  // Risk management
  ATR_STOP_MULTIPLIER: 1.5,
  MIN_RISK_REWARD: 2,
  BREAKEVEN_THRESHOLD: 0.05,
  DEFAULT_RISK_PERCENT: 0.015,
  MAX_POSITION_PERCENT: 0.08,

  // Position limits
  MAX_OPEN_POSITIONS: 10,
  MAX_DAILY_TRADES: 5,

  // SEBI compliance
  MAX_ORDERS_PER_SECOND: 8,
  ALGO_TAG: 'AMT001',

  // Rate limits (Kite Connect)
  ORDER_RATE_LIMIT: 3,       // per second
  QUOTE_RATE_LIMIT: 1,       // per second
  HISTORICAL_RATE_LIMIT: 3,  // per second

  // Market hours (IST)
  MARKET_OPEN_HOUR: 9,
  MARKET_OPEN_MINUTE: 15,
  MARKET_CLOSE_HOUR: 15,
  MARKET_CLOSE_MINUTE: 30,

  // Indicator periods
  EMA_SHORT: 20,
  EMA_MEDIUM: 50,
  EMA_LONG: 200,
  RSI_PERIOD: 14,
  ADX_PERIOD: 14,
  ATR_PERIOD: 14,

  // Data requirements
  MIN_HISTORY_DAYS: 250,
} as const;
