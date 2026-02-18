export type SignalAction = 'BUY' | 'SKIP' | 'HOLD';
export type SetupQuality = 'A' | 'B' | 'C';

export interface TradingSignal {
  id?: number;
  date: string;
  tradingsymbol: string;
  exchange: string;
  cmp: number;
  action: SignalAction;
  entry?: number;
  stopLoss?: number;
  target?: number;
  positionSize?: number;
  riskRewardRatio?: number;
  confidence?: number;
  reasoning?: string;
  phase: 'screener' | 'analyst';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface StockAnalysis {
  ticker: string;
  action: 'BUY' | 'SKIP';
  confidence: number;
  entry: number;
  stopLoss: number;
  target: number;
  reasoning: string;
  setupQuality: SetupQuality;
  keyRisks: string[];
}

export interface BatchAnalysis {
  date: string;
  analyses: StockAnalysis[];
  summary: string;
  topPick: string;
}

export interface ScreenerCandidate {
  tradingsymbol: string;
  exchange: string;
  cmp: number;
  ema20: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  adx14: number;
  atr14: number;
  sector: string;
  weeklyReturn: number;
  volumeRatio: number;
  marketCap: number;
  patterns: string[];
}

export interface IndicatorSnapshot {
  tradingsymbol: string;
  date: string;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi14?: number;
  adx14?: number;
  atr14?: number;
  weeklyReturn?: number;
  volumeRatio?: number;
  patterns?: string[];
}
