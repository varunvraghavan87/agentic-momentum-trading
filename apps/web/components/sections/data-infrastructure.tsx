'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, Zap, Server, Activity } from 'lucide-react'

export function DataInfrastructure() {
  const dataSources = [
    {
      name: 'Zerodha Kite Connect',
      type: 'Real-time quotes, OHLCV, depth',
      latency: '~200ms',
      cost: '₹2,000/month + brokerage',
    },
    {
      name: 'NSE Official APIs',
      type: 'Real-time feeds (CM, F&O)',
      latency: '~50ms',
      cost: 'Commercial licensing',
    },
    {
      name: 'Global Datafeeds',
      type: 'WebSocket streaming, REST API',
      latency: '~100ms',
      cost: 'Subscription-based',
    },
  ]

  const indicators = [
    { name: 'RSI(14)', code: 'talib.RSI(close, timeperiod=14)', threshold: '60-80' },
    { name: 'EMA(20, 200)', code: 'talib.EMA(close, timeperiod=n)', threshold: 'Trend confirmation' },
    { name: 'ADX(14)', code: 'talib.ADX(high, low, close, timeperiod=14)', threshold: '>25' },
    { name: 'ATR(14)', code: 'talib.ATR(high, low, close, timeperiod=14)', threshold: 'Stop-loss sizing' },
  ]

  const endpoints = [
    { method: 'GET', endpoint: '/quote?i=NSE:SYMBOL', description: 'Full market quotes (500 instruments/request)' },
    { method: 'GET', endpoint: '/instruments/NSE', description: 'Daily instrument list (CSV, 08:30 AM IST)' },
    { method: 'GET', endpoint: '/instruments/historical/...', description: 'Historical OHLCV data' },
    { method: 'WS', endpoint: 'wss://ws.kite.trade', description: 'Real-time tick streaming (3,000 instruments)' },
  ]

  return (
    <section id="data" className="py-24 px-6 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Data Infrastructure & Pipeline</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
            Multi-source data acquisition with sub-second latency, ensuring redundancy and SEBI compliance for algorithmic trading.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8">Live Data Sources</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {dataSources.map((source) => (
              <Card key={source.name} className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  <Database className="w-5 h-5 text-primary mt-1" />
                  <h4 className="font-bold text-lg">{source.name}</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Data Type</span>
                    <p className="text-sm">{source.type}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">Latency</span>
                      <p className="text-sm font-mono text-accent">{source.latency}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Cost</span>
                      <p className="text-sm font-semibold">{source.cost}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8">API Endpoints & Data Acquisition</h3>
          <Card className="p-8 bg-card/50 backdrop-blur border-border">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-primary" />
              <h4 className="text-xl font-semibold">Zerodha Kite Connect (Primary Source)</h4>
            </div>
            <div className="space-y-3">
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.endpoint}
                  className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
                >
                  <Badge
                    variant={endpoint.method === 'WS' ? 'default' : 'outline'}
                    className="self-start"
                  >
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm text-primary font-mono flex-1">
                    {endpoint.endpoint}
                  </code>
                  <span className="text-sm text-muted-foreground">
                    {endpoint.description}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Update Frequencies:</strong> Market quotes refresh every 1 second during market hours (09:15-15:30 IST). Historical data requires 200+ trading days for EMA-200 baseline calculation.
              </p>
            </div>
          </Card>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8">Data Pipeline Architecture</h3>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card className="p-6 bg-card/50 backdrop-blur border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-bold">Collection</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                WebSocket streams from Kite Connect for Nifty 200 constituents with 5-minute buffering in Redis
              </p>
            </Card>
            <Card className="p-6 bg-card/50 backdrop-blur border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-bold">Processing</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                TA-Lib indicator calculation on each bar close with incremental computation
              </p>
            </Card>
            <Card className="p-6 bg-card/50 backdrop-blur border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="font-bold">Storage</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                TimescaleDB hypertables with 1-year retention and automated indexing
              </p>
            </Card>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-8">Technical Indicator Calculation</h3>
          <Card className="p-8 bg-card/50 backdrop-blur border-border">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-primary" />
              <h4 className="text-xl font-semibold">TA-Lib Implementation</h4>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {indicators.map((indicator) => (
                <div
                  key={indicator.name}
                  className="p-4 rounded-lg bg-background border border-border hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono">
                      {indicator.name}
                    </Badge>
                    <span className="text-xs text-accent">{indicator.threshold}</span>
                  </div>
                  <code className="text-xs text-muted-foreground block mt-2">
                    {indicator.code}
                  </code>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
              <p className="text-sm text-muted-foreground">
                <strong>Caching Strategy:</strong> Computed indicators persist in TimescaleDB with 1-year retention. Incremental calculation on new bars reduces compute overhead by 90%.
              </p>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <div className="flex items-start gap-4">
              <Server className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h4 className="text-xl font-bold mb-3">Database Schema (TimescaleDB)</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold mb-2">Hypertable: market_data</h5>
                    <code className="text-xs text-muted-foreground block">
                      symbol VARCHAR(20), timestamp TIMESTAMPTZ, open/high/low/close NUMERIC(10,2), volume BIGINT, rsi_14 NUMERIC(5,2), ema_20/ema_200 NUMERIC(10,2), adx_14 NUMERIC(5,2), atr_14 NUMERIC(10,2)
                    </code>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Table: trading_signals</h5>
                    <code className="text-xs text-muted-foreground block">
                      signal_id SERIAL, symbol VARCHAR(20), signal_time TIMESTAMPTZ, phase_1_pass BOOLEAN, phase_2_pass BOOLEAN, llm_score NUMERIC(3,2), entry_price NUMERIC(10,2), stop_loss NUMERIC(10,2), target NUMERIC(10,2)
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
