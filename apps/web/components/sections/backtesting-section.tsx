'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Activity, Target, Award } from 'lucide-react'

export function BacktestingSection() {
  const metrics = [
    { icon: TrendingUp, label: 'CAGR', description: 'Mean annual portfolio growth rate', purpose: 'Performance' },
    { icon: Activity, label: 'Sharpe Ratio', description: 'Risk-adjusted return vs. volatility', purpose: 'Efficiency' },
    { icon: Target, label: 'Max Drawdown', description: 'Largest peak-to-trough decline', purpose: 'Risk' },
    { icon: Award, label: 'Win Rate', description: 'Percentage of profitable trades', purpose: 'Accuracy' },
  ]

  const strategySteps = [
    { step: 1, title: 'Liquidity Check', code: '30-day SMA of volume > 500,000 shares' },
    { step: 2, title: 'Trend Filter', code: 'Current close > 200-day EMA' },
    { step: 3, title: 'Entry Signal', code: 'RSI(14) > 60 AND ADX(14) > 25' },
    { step: 4, title: 'Position Sizing', code: 'Risk 1% per trade: Size = (Portfolio × 0.01) / (Entry - Stop)' },
    { step: 5, title: 'Order Execution', code: 'Bracket order: Entry, Stop (2× ATR), Target (3:1 R:R)' },
    { step: 6, title: 'Exit Signal', code: 'Price closes below 50-day EMA' },
  ]

  return (
    <section id="backtesting" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Backtesting Strategy</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
            Backtrader was selected for its realistic broker simulation, customizable position sizers, and event-driven architecture preventing look-ahead bias.
          </p>
        </div>

        <Tabs defaultValue="logic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="logic">Strategy Logic</TabsTrigger>
            <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="logic">
            <Card className="p-8 bg-card/50 backdrop-blur border-border">
              <h3 className="text-2xl font-bold mb-6">Sequential Filtering Process</h3>
              <p className="text-muted-foreground mb-8">
                The strategy evaluates the Nifty 200 universe weekly. Each stock undergoes sequential filtering:
              </p>

              <div className="space-y-4">
                {strategySteps.map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-4 p-5 rounded-lg bg-background border border-border hover:border-primary/50 transition-all duration-300 hover:translate-x-2"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{item.title}</h4>
                      <code className="text-sm text-accent bg-accent/10 px-3 py-1 rounded border border-accent/20 block">
                        {item.code}
                      </code>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-muted/30 rounded-lg border border-border">
                <h4 className="font-semibold mb-3">Implementation Notes</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Event-driven architecture prevents look-ahead bias</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Multi-asset capability for portfolio-level testing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Realistic broker simulation with slippage and commissions</span>
                  </li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            <div className="grid md:grid-cols-2 gap-6">
              {metrics.map((metric) => {
                const Icon = metric.icon
                return (
                  <Card
                    key={metric.label}
                    className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-xl font-bold">{metric.label}</h4>
                          <Badge variant="outline" className="text-xs">
                            {metric.purpose}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            <Card className="mt-6 p-8 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
              <h3 className="text-2xl font-bold mb-4">Benchmark Comparison</h3>
              <p className="text-muted-foreground mb-4">
                <strong>Benchmark:</strong> Nifty 200 Total Return Index (TRI) buy-and-hold strategy
              </p>
              <p className="text-sm text-muted-foreground">
                PyFolio integration provides comprehensive analytics comparing active strategy alpha generation against passive investment, including drawdown analysis, return distribution, and rolling performance metrics.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
