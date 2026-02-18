'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

export function FrameworkOverview() {
  const [activePhase, setActivePhase] = useState('phase1')

  const phases = [
    {
      id: 'phase1',
      title: 'Universe & Liquidity',
      color: '#3b82f6',
      criteria: [
        { label: 'Universe', value: 'Nifty 500 constituents', rationale: 'Ensures fundamental baseline quality' },
        { label: 'Market Cap', value: '> ₹5,000 Crores', rationale: 'Avoids manipulation-prone micro-caps' },
        { label: 'Avg Daily Turnover', value: '> ₹20 Crores (20-day)', rationale: 'Ensures entry/exit without slippage' },
        { label: 'Surveillance', value: 'Exclude ASM/GSM Stage 2+', rationale: 'Regulatory risk mitigation' },
      ],
    },
    {
      id: 'phase2',
      title: 'Trend Establishment',
      color: '#10b981',
      criteria: [
        { label: 'EMA Alignment', value: 'Price > 20 EMA > 50 EMA > 200 EMA', rationale: 'Golden alignment for institutional flows' },
        { label: 'Relative Strength', value: '3M performance > Nifty 50', rationale: 'Outperforming the broader market' },
        { label: 'ADX (14-period)', value: '> 25', rationale: 'Confirms trending market conditions' },
      ],
    },
    {
      id: 'phase3',
      title: 'Entry Signal',
      color: '#f59e0b',
      criteria: [
        { label: 'Setup', value: 'Pullback to 20/50 EMA', rationale: 'Weakness within strength opportunity' },
        { label: 'RSI (14-period)', value: 'Dips to 40-55, then hooks up', rationale: 'Cool-off before resumption' },
        { label: 'Volume', value: 'Lower on pullback days', rationale: 'Selling exhaustion signal' },
        { label: 'Candlestick', value: 'Hammer/Bullish Engulfing', rationale: 'Price action confirmation' },
      ],
    },
    {
      id: 'phase4',
      title: 'Risk Management',
      color: '#ef4444',
      criteria: [
        { label: 'Stop Loss', value: '1.5x ATR below entry', rationale: 'Maximum 8% capital loss' },
        { label: 'Target', value: 'Minimum 1:2 Risk:Reward', rationale: 'Asymmetric return profile' },
        { label: 'Trailing Stop', value: 'Breakeven at +5%, then 20 EMA', rationale: 'Protect profits, ride trends' },
      ],
    },
  ]

  return (
    <section id="framework" className="py-24 px-6 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Nifty Velocity Alpha Framework</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
            A systematic pullback momentum approach identifying stocks in structural uptrends offering temporary discounts before resuming their trajectories.
          </p>
        </div>

        <Tabs value={activePhase} onValueChange={setActivePhase} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-12 h-auto gap-2">
            {phases.map((phase, index) => (
              <TabsTrigger
                key={phase.id}
                value={phase.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
              >
                <span className="font-mono mr-2">{index + 1}</span>
                {phase.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {phases.map((phase) => (
            <TabsContent key={phase.id} value={phase.id} className="mt-0">
              <Card className="p-8 bg-card/50 backdrop-blur border-border">
                <div className="flex items-center gap-3 mb-8">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl"
                    style={{ backgroundColor: `${phase.color}20`, color: phase.color }}
                  >
                    {phases.findIndex((p) => p.id === phase.id) + 1}
                  </div>
                  <h3 className="text-3xl font-bold">{phase.title}</h3>
                </div>

                <div className="space-y-6">
                  {phase.criteria.map((criterion, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg bg-background/50 border border-border hover:border-primary/50 transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="outline" className="font-semibold">
                            {criterion.label}
                          </Badge>
                          <span className="font-mono text-sm text-primary">
                            {criterion.value}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {criterion.rationale}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-16">
          <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <h3 className="text-2xl font-bold mb-4">Framework Highlights</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-primary">Entry Philosophy</h4>
                <p className="text-muted-foreground text-sm">
                  Entry occurs on weakness within strength, combining multiple technical confirmations to identify high-probability setups where institutional money flows are rising.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-accent">Risk Control</h4>
                <p className="text-muted-foreground text-sm">
                  Two-stage trailing stop mechanism moves to breakeven at +5% profit, then trails using 20-day EMA to protect accumulated gains while allowing trends to continue.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
