export interface AppConfig {
  tradingMode: 'paper' | 'live';
  kiteApiKey: string;
  kiteApiSecret: string;
  kiteAccessToken?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  llmPrimary: 'claude' | 'openai';
  databasePath: string;
  apiPort: number;
  apiHost: string;
  maxPortfolioDrawdown: number;
  dailyLossLimit: number;
  maxPerTradeRisk: number;
  riskPerTrade: number;
  nodeEnv: 'development' | 'production' | 'test';
}

export interface PortfolioState {
  equity: number;
  peakEquity: number;
  dailyPnl: number;
  dailyPnlPercent: number;
  drawdown: number;
  drawdownPercent: number;
  openPositionCount: number;
  killSwitchActive: boolean;
}
