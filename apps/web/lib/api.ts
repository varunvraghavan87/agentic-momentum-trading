const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchAPI<T = unknown>(path: string): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function postAPI<T = unknown>(path: string, body: unknown): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ─── Response Types ───

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  mode: string;
  db: string;
  memory: { rss: number; heapUsed: number };
  cron: boolean;
}

export interface PortfolioResponse {
  positions: Array<{
    tradingsymbol: string;
    quantity: number;
    averagePrice: number;
    lastPrice: number;
    pnl: number;
    pnlPercent: number;
  }>;
  snapshot: {
    totalEquity: number;
    peakEquity: number;
    dailyPnl: number;
    dailyPnlPercent: number;
    drawdown: number;
    drawdownPercent: number;
    openPositions: number;
  } | null;
  recentOrders: Array<{
    orderId: string;
    tradingsymbol: string;
    transactionType: string;
    orderType: string;
    quantity: number;
    price: number;
    status: string;
    placedAt: string;
  }>;
}

export interface SignalResponse {
  id: number;
  date: string;
  tradingsymbol: string;
  exchange: string;
  action: string;
  entry: number;
  stopLoss: number;
  target: number;
  confidence: number;
  reasoning: string;
  phase: string;
}

export interface ConfigResponse {
  tradingMode: string;
  killSwitchActive: boolean;
  riskParams: {
    maxPortfolioDrawdown: number;
    dailyLossLimit: number;
    maxPerTradeRisk: number;
    riskPerTrade: number;
  };
}

export interface EquityCurvePoint {
  date: string;
  equity: number;
  drawdown: number;
}
