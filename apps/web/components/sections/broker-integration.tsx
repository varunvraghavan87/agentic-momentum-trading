'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Key, Send, AlertCircle, CheckCircle } from 'lucide-react'

export function BrokerIntegration() {
  const authSteps = [
    { step: 1, title: 'API Key Generation', description: 'Create Kite Connect app and obtain API key' },
    { step: 2, title: 'Request Token', description: 'User authorization via OAuth2 flow' },
    { step: 3, title: 'Access Token', description: 'Exchange request token for 24-hour access token' },
    { step: 4, title: 'IP Whitelisting', description: 'Static IP configuration for security' },
  ]

  const orderTypes = [
    {
      type: 'Market Order',
      description: 'Immediate execution at best available price',
      useCase: 'Urgent entries/exits',
      color: '#3b82f6',
    },
    {
      type: 'Limit Order',
      description: 'Execution at specified price or better',
      useCase: 'Planned entries with price discipline',
      color: '#10b981',
    },
    {
      type: 'Stop-Loss Order',
      description: 'Triggered when price reaches stop level',
      useCase: 'Automated risk management',
      color: '#ef4444',
    },
  ]

  const rateLimits = [
    { action: 'Order Placement', limit: '3 requests/second', threshold: 'System enforced' },
    { action: 'Quote Fetching', limit: '1 request/second', threshold: 'WebSocket preferred' },
    { action: 'Historical Data', limit: '3 requests/second', threshold: 'Batch requests' },
  ]

  return (
    <section id="broker" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Broker API Integration</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
            Zerodha Kite Connect integration with OAuth2 authentication, automated order placement, and SEBI-compliant rate limiting.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8">Authentication Flow</h3>
          <Card className="p-8 bg-card/50 backdrop-blur border-border">
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-8 h-8 text-primary" />
              <div>
                <h4 className="text-xl font-bold">OAuth2 with Static IP Whitelisting</h4>
                <p className="text-sm text-muted-foreground">Monthly subscription: ₹2,000 | Token validity: 24 hours</p>
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {authSteps.map((step) => (
                <div key={step.step} className="relative">
                  <Card className="p-6 h-full bg-background border-border hover:border-primary/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold mb-3">
                      {step.step}
                    </div>
                    <h5 className="font-semibold mb-2 text-sm">{step.title}</h5>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </Card>
                  {step.step < 4 && (
                    <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="w-4 h-0.5 bg-primary"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 inline mr-2 text-accent" />
                Two-factor authentication and static IP whitelisting as mandated by SEBI's retail algo framework
              </p>
            </div>
          </Card>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8">Order Execution Types</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {orderTypes.map((order) => (
              <Card
                key={order.type}
                className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-3 mb-4">
                  <Send className="w-6 h-6 flex-shrink-0" style={{ color: order.color }} />
                  <div>
                    <h4 className="font-bold mb-1">{order.type}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{order.description}</p>
                    <Badge variant="outline" className="text-xs">
                      {order.useCase}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8">Rate Limiting & Error Handling</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-8 bg-card/50 backdrop-blur border-border">
              <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-[#f59e0b]" />
                Rate Limits
              </h4>
              <div className="space-y-4">
                {rateLimits.map((limit) => (
                  <div
                    key={limit.action}
                    className="flex items-center justify-between p-4 rounded-lg bg-background border border-border"
                  >
                    <div>
                      <p className="font-semibold text-sm">{limit.action}</p>
                      <p className="text-xs text-muted-foreground">{limit.threshold}</p>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {limit.limit}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm text-muted-foreground">
                  <strong>SEBI Compliance:</strong> System throttled at 8 orders/sec, well below the 10 orders/sec registration threshold
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-border">
              <h4 className="text-xl font-bold mb-6">Error Handling Strategy</h4>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-background border border-border">
                  <h5 className="font-semibold text-sm mb-2">Exponential Backoff</h5>
                  <p className="text-xs text-muted-foreground">
                    Failed requests retry with increasing delays: 1s, 2s, 4s, 8s
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background border border-border">
                  <h5 className="font-semibold text-sm mb-2">Order Status Tracking</h5>
                  <p className="text-xs text-muted-foreground">
                    Unique order ID monitoring from placement through execution/rejection
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background border border-border">
                  <h5 className="font-semibold text-sm mb-2">Circuit Breaker</h5>
                  <p className="text-xs text-muted-foreground">
                    Automatic halt after 3 consecutive failures with alert notification
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <h3 className="text-2xl font-bold mb-4">ExecutionAgent Integration</h3>
          <p className="text-muted-foreground mb-6">
            The ExecutionAgent interfaces with Kite Connect API for automated trade execution with comprehensive pre-trade validation and post-trade reconciliation.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-background/50 rounded-lg border border-border">
              <h5 className="font-semibold mb-2 text-sm">Pre-Trade Checks</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Sufficient margin available</li>
                <li>• Order within risk limits</li>
                <li>• Stock not in ban list</li>
              </ul>
            </div>
            <div className="p-4 bg-background/50 rounded-lg border border-border">
              <h5 className="font-semibold mb-2 text-sm">Order Execution</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Bracket order placement</li>
                <li>• Stop-loss & target set</li>
                <li>• Order confirmation received</li>
              </ul>
            </div>
            <div className="p-4 bg-background/50 rounded-lg border border-border">
              <h5 className="font-semibold mb-2 text-sm">Post-Trade</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Fill price verification</li>
                <li>• Position reconciliation</li>
                <li>• Trade log persistence</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
