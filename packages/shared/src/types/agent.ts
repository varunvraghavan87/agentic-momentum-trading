export type AgentName = 'DataAgent' | 'IndicatorAgent' | 'ScreenerAgent' | 'AnalystAgent' | 'ExecutionAgent';
export type AgentStatus = 'success' | 'error';

export interface AgentResult<T = unknown> {
  agentName: AgentName;
  status: AgentStatus;
  data?: T;
  error?: string;
  timestamp: string;
  durationMs: number;
}

export interface DataAgentOutput {
  date: string;
  instrumentCount: number;
  ohlcvSymbols: string[];
}

export interface IndicatorAgentOutput {
  date: string;
  snapshotCount: number;
  symbols: string[];
}

export interface ScreenerOutput {
  date: string;
  candidateCount: number;
  candidates: import('./signal.js').ScreenerCandidate[];
}

export interface ExecutionResult {
  trades: TradeExecution[];
  reason?: string;
}

export interface TradeExecution {
  ticker: string;
  orderId: string;
  slOrderId?: string;
  shares: number;
  entry: number;
  stopLoss: number;
  target: number;
}
