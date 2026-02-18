'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, AlertTriangle, TrendingUp, Percent } from 'lucide-react'

export function RiskManagement() {
  const [accountEquity, setAccountEquity] = useState('1000000')
  const [entryPrice, setEntryPrice] = useState('145')
  const [stopLoss, setStopLoss] = useState('140')
  const [riskPercent, setRiskPercent] = useState('1.5')

  const calculatePosition = () => {
    const equity = parseFloat(accountEquity) || 0
    const entry = parseFloat(entryPrice) || 0
    const stop = parseFloat(stopLoss) || 0
    const risk = parseFloat(riskPercent) || 0

    const riskAmount = (equity * risk) / 100
    const riskPerShare = entry - stop
    const shares = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0
    const target = entry + riskPerShare * 2
    const positionValue = shares * entry

    return { shares, riskAmount, riskPerShare, target, positionValue }
  }

  const position = calculatePosition()

  const riskControls = [
    {
      level: 'Trade-Level',
      icon: Shield,
      color: '#3b82f6',
      controls: [
        { label: 'Initial Stop-Loss', value: '1.5× ATR(14) below entry', detail: 'Secondary check: recent swing low' },
        { label: 'Take-Profit Target', value: 'Minimum 1:2 Risk:Reward', detail: 'TP = Entry + (Risk Per Share × 2)' },
        { label: 'Trailing Stop Stage 1', value: 'Move to breakeven at +5%', detail: 'Protect capital after initial move' },
        { label: 'Trailing Stop Stage 2', value: 'Trail via 20-day EMA', detail: 'Lock profits, ride trend' },
      ],
    },
    {
      level: 'Portfolio-Level',
      icon: AlertTriangle,
      color: '#f59e0b',
      controls: [
        { label: 'Max Portfolio Drawdown', value: '15% from peak equity', detail: 'Master kill switch triggers' },
        { label: 'Daily Loss Limit', value: '3% of opening portfolio', detail: 'Single-day protection' },
        { label: 'Max Risk Per Trade', value: '8% of account equity', detail: 'Hard cap on position size' },
      ],
    },
    {
      level: 'SEBI Compliance',
      icon: Badge,
      color: '#10b981',
      controls: [
        { label: 'Order Rate Throttling', value: '8 orders per second', detail: 'Below 10 orders/sec threshold' },
        { label: 'Unique Algo ID', value: 'All orders tagged', detail: 'Complete audit trail' },
        { label: 'Manual Kill Switch', value: 'Risk management access', detail: 'Immediate cessation capability' },
      ],
    },
  ]

  return (
    <section id="risk" className="py-24 px-6 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Risk Management System</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
            Comprehensive multi-layered risk controls combining position sizing algorithms, stop-loss mechanisms, and SEBI-compliant safeguards.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">Interactive Position Sizing Calculator</h3>
          <Card className="p-8 bg-card/50 backdrop-blur border-border max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <Label htmlFor="equity">Account Equity (₹)</Label>
                <Input
                  id="equity"
                  type="number"
                  value={accountEquity}
                  onChange={(e) => setAccountEquity(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk">Risk Per Trade (%)</Label>
                <Input
                  id="risk"
                  type="number"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry">Entry Price (₹)</Label>
                <Input
                  id="entry"
                  type="number"
                  step="0.1"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stop">Stop Loss (₹)</Label>
                <Input
                  id="stop"
                  type="number"
                  step="0.1"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h4 className="font-semibold mb-4">Calculated Position</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Number of Shares</p>
                  <p className="text-2xl font-bold text-primary">{position.shares.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-sm text-muted-foreground mb-1">Position Value</p>
                  <p className="text-2xl font-bold text-accent">₹{position.positionValue.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20">
                  <p className="text-sm text-muted-foreground mb-1">Target Price (1:2)</p>
                  <p className="text-2xl font-bold text-[#f59e0b]">₹{position.target.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Risk Amount:</strong> ₹{position.riskAmount.toLocaleString()} ({riskPercent}% of equity) | <strong>Risk Per Share:</strong> ₹{position.riskPerShare.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Formula:</strong> Number of Shares = (Account Equity × Risk %) / (Entry Price - Stop Loss)
              </p>
            </div>
          </Card>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">Position Sizing Algorithm</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-8 bg-card/50 backdrop-blur border-border">
              <div className="flex items-center gap-3 mb-4">
                <Percent className="w-8 h-8 text-primary" />
                <h4 className="text-xl font-bold">Fixed Fractional Method</h4>
              </div>
              <p className="text-muted-foreground mb-4">
                Primary model uses a fixed 1.5% risk fraction of total account equity per trade.
              </p>
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <code className="text-sm text-primary">
                  Shares = (Equity × 0.015) / (Entry - Stop)
                </code>
              </div>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-border">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-8 h-8 text-accent" />
                <h4 className="text-xl font-bold">Fractional Kelly Criterion</h4>
              </div>
              <p className="text-muted-foreground mb-4">
                Secondary overlay dynamically adjusts risk fraction (1.0-2.0%) based on strategy performance.
              </p>
              <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                <code className="text-sm text-accent">
                  K% = W - [(1-W)/R] × 0.5
                </code>
              </div>
            </Card>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-8 text-center">Risk Control Hierarchy</h3>
          <div className="space-y-6">
            {riskControls.map((category) => {
              const Icon = category.icon
              return (
                <Card key={category.level} className="p-8 bg-card/50 backdrop-blur border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: `${category.color}20`,
                        color: category.color,
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-2xl font-bold">{category.level} Controls</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {category.controls.map((control) => (
                      <div
                        key={control.label}
                        className="p-4 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-sm">{control.label}</h5>
                          <Badge variant="outline" className="text-xs ml-2">
                            {control.value}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{control.detail}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
