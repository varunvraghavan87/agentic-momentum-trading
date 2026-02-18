'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  Activity,
  Shield,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Clock,
  Server,
} from 'lucide-react'
import { EquityCurve } from './equity-curve'
import type {
  HealthResponse,
  PortfolioResponse,
  SignalResponse,
  ConfigResponse,
} from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function fetchAPI<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null)
  const [signals, setSignals] = useState<SignalResponse[] | null>(null)
  const [config, setConfig] = useState<ConfigResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<string>('')

  const refresh = async () => {
    setLoading(true)
    const [h, p, s, c] = await Promise.all([
      fetchAPI<HealthResponse>('/api/health'),
      fetchAPI<PortfolioResponse>('/api/dashboard/portfolio'),
      fetchAPI<SignalResponse[]>('/api/signals/today'),
      fetchAPI<ConfigResponse>('/api/config'),
    ])
    setHealth(h)
    setPortfolio(p)
    setSignals(s)
    setConfig(c)
    setLastRefresh(new Date().toLocaleTimeString())
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30_000) // Auto-refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const apiConnected = health?.status === 'ok'

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Nifty Velocity Alpha</h1>
              <p className="text-xs text-muted-foreground">Agentic Momentum Trading</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={apiConnected ? 'default' : 'destructive'}>
              {apiConnected ? 'API Connected' : 'API Offline'}
            </Badge>
            <Badge variant={config?.tradingMode === 'live' ? 'destructive' : 'secondary'}>
              {config?.tradingMode?.toUpperCase() || 'PAPER'} MODE
            </Badge>
            {config?.killSwitchActive && (
              <Badge variant="destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                KILL SWITCH ACTIVE
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Last refresh: {lastRefresh || '—'}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatusCard
            icon={<Server className="w-5 h-5" />}
            label="System"
            value={apiConnected ? 'Online' : 'Offline'}
            detail={health ? `Uptime: ${formatUptime(health.uptime)}` : 'Connecting...'}
            status={apiConnected ? 'ok' : 'error'}
          />
          <StatusCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Equity"
            value={formatCurrency(portfolio?.snapshot?.totalEquity || 0)}
            detail={`Peak: ${formatCurrency(portfolio?.snapshot?.peakEquity || 0)}`}
            status="ok"
          />
          <StatusCard
            icon={<Activity className="w-5 h-5" />}
            label="Daily P&L"
            value={formatCurrency(portfolio?.snapshot?.dailyPnl || 0)}
            detail={`${((portfolio?.snapshot?.dailyPnlPercent || 0) * 100).toFixed(2)}%`}
            status={(portfolio?.snapshot?.dailyPnl || 0) >= 0 ? 'ok' : 'warning'}
          />
          <StatusCard
            icon={<Shield className="w-5 h-5" />}
            label="Drawdown"
            value={`${((portfolio?.snapshot?.drawdownPercent || 0) * 100).toFixed(1)}%`}
            detail={`Max: 15% limit`}
            status={(portfolio?.snapshot?.drawdownPercent || 0) < 0.1 ? 'ok' : 'warning'}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="signals">Signals</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Equity Curve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EquityCurve />
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Open Positions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolio?.positions && portfolio.positions.length > 0 ? (
                    <div className="space-y-3">
                      {portfolio.positions.map((pos) => (
                        <div
                          key={pos.tradingsymbol}
                          className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
                        >
                          <div>
                            <p className="font-semibold">{pos.tradingsymbol}</p>
                            <p className="text-xs text-muted-foreground">
                              {pos.quantity} shares @ {formatCurrency(pos.averagePrice)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {formatCurrency(pos.pnl)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <Activity className="w-10 h-10 mb-2 opacity-30" />
                      <p>No open positions</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Signals Tab */}
          <TabsContent value="signals">
            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Today&apos;s Trading Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {signals && signals.length > 0 ? (
                  <div className="space-y-4">
                    {signals.map((signal) => (
                      <div
                        key={signal.id}
                        className="p-4 rounded-lg bg-background/50 border border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={signal.action === 'BUY' ? 'default' : 'secondary'}>
                              {signal.action}
                            </Badge>
                            <span className="font-bold">{signal.tradingsymbol}</span>
                            <Badge variant="outline">{signal.exchange}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Confidence: {(signal.confidence * 100).toFixed(0)}%
                            </Badge>
                            <Badge variant="outline">{signal.phase}</Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Entry:</span>{' '}
                            <span className="font-mono">{formatCurrency(signal.entry)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Stop Loss:</span>{' '}
                            <span className="font-mono text-red-400">
                              {formatCurrency(signal.stopLoss)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Target:</span>{' '}
                            <span className="font-mono text-green-400">
                              {formatCurrency(signal.target)}
                            </span>
                          </div>
                        </div>
                        {signal.reasoning && (
                          <p className="mt-2 text-sm text-muted-foreground">{signal.reasoning}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <TrendingUp className="w-10 h-10 mb-2 opacity-30" />
                    <p>No signals generated today</p>
                    <p className="text-xs mt-1">
                      Signals are generated at 15:15 IST after market close
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {portfolio?.recentOrders && portfolio.recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-2 px-2">Time</th>
                          <th className="text-left py-2 px-2">Symbol</th>
                          <th className="text-left py-2 px-2">Type</th>
                          <th className="text-right py-2 px-2">Qty</th>
                          <th className="text-right py-2 px-2">Price</th>
                          <th className="text-left py-2 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.recentOrders.map((order) => (
                          <tr key={order.orderId} className="border-b border-border/50">
                            <td className="py-2 px-2 text-muted-foreground">
                              {new Date(order.placedAt).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-2 px-2 font-semibold">{order.tradingsymbol}</td>
                            <td className="py-2 px-2">
                              <Badge
                                variant={order.transactionType === 'BUY' ? 'default' : 'destructive'}
                              >
                                {order.transactionType} {order.orderType}
                              </Badge>
                            </td>
                            <td className="py-2 px-2 text-right font-mono">{order.quantity}</td>
                            <td className="py-2 px-2 text-right font-mono">
                              {formatCurrency(order.price)}
                            </td>
                            <td className="py-2 px-2">
                              <Badge
                                variant={
                                  order.status === 'COMPLETE'
                                    ? 'default'
                                    : order.status === 'OPEN'
                                      ? 'secondary'
                                      : 'destructive'
                                }
                              >
                                {order.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Clock className="w-10 h-10 mb-2 opacity-30" />
                    <p>No recent orders</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {health ? (
                    <div className="space-y-3">
                      <InfoRow label="Status" value={health.status} />
                      <InfoRow label="Version" value={health.version} />
                      <InfoRow label="Uptime" value={formatUptime(health.uptime)} />
                      <InfoRow label="Trading Mode" value={health.mode.toUpperCase()} />
                      <InfoRow label="Database" value={health.db} />
                      <InfoRow label="Cron Jobs" value={health.cron ? 'Registered' : 'Not registered'} />
                      <InfoRow label="Memory (RSS)" value={`${health.memory.rss} MB`} />
                      <InfoRow label="Memory (Heap)" value={`${health.memory.heapUsed} MB`} />
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Unable to connect to API</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Risk Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {config ? (
                    <div className="space-y-3">
                      <InfoRow
                        label="Kill Switch"
                        value={config.killSwitchActive ? 'ACTIVE' : 'Inactive'}
                      />
                      <InfoRow
                        label="Max Drawdown"
                        value={`${(config.riskParams.maxPortfolioDrawdown * 100).toFixed(0)}%`}
                      />
                      <InfoRow
                        label="Daily Loss Limit"
                        value={`${(config.riskParams.dailyLossLimit * 100).toFixed(0)}%`}
                      />
                      <InfoRow
                        label="Max Per Trade Risk"
                        value={`${(config.riskParams.maxPerTradeRisk * 100).toFixed(0)}%`}
                      />
                      <InfoRow
                        label="Risk Per Trade"
                        value={`${(config.riskParams.riskPerTrade * 100).toFixed(1)}%`}
                      />
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Unable to load configuration</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-muted-foreground">
          <a href="/" className="hover:text-primary transition-colors">
            &larr; Back to Documentation
          </a>
        </div>
      </div>
    </main>
  )
}

// ─── Helper Components ───

function StatusCard({
  icon,
  label,
  value,
  detail,
  status,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
  status: 'ok' | 'warning' | 'error'
}) {
  const borderColor =
    status === 'ok'
      ? 'border-green-500/30'
      : status === 'warning'
        ? 'border-yellow-500/30'
        : 'border-red-500/30'

  return (
    <Card className={`p-4 bg-card/50 backdrop-blur ${borderColor}`}>
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{detail}</p>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-mono">{value}</span>
    </div>
  )
}

// ─── Utility Functions ───

function formatCurrency(value: number): string {
  if (value === 0) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}
