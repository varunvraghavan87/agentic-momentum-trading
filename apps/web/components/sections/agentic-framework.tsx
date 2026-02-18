'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, Calculator, Filter, Brain, Zap, ArrowRight } from 'lucide-react'

export function AgenticFramework() {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)

  const agents = [
    {
      id: 'data',
      name: 'DataAgent',
      icon: Database,
      color: '#3b82f6',
      role: 'Information Gatherer',
      tasks: [
        'Fetch Nifty 500 constituent list from NSE',
        'Retrieve daily OHLCV data for all constituents',
        'Obtain fundamental data (Market Cap)',
        'Query ASM/GSM surveillance lists',
        'Fetch earnings announcement dates',
      ],
      output: 'Clean, timestamped data in centralized database',
    },
    {
      id: 'indicator',
      name: 'IndicatorAgent',
      icon: Calculator,
      color: '#10b981',
      role: 'Quantitative Analyst',
      tasks: [
        'Calculate 20/50/200 EMA',
        'Compute 20-day Average Daily Turnover',
        'Calculate 3-month relative strength vs. Nifty 50',
        'Compute RSI(14), ADX(14), ATR(14)',
        'Identify candlestick patterns',
      ],
      output: 'Technical indicators stored with OHLCV data',
    },
    {
      id: 'screener',
      name: 'ScreenerAgent',
      icon: Filter,
      color: '#f59e0b',
      role: 'The Filter',
      tasks: [
        'Phase 1: Market Cap > ₹5,000 Cr, ADT > ₹20 Cr',
        'Phase 1: Exclude ASM/GSM stocks',
        'Phase 2: Price > 20 EMA > 50 EMA > 200 EMA',
        'Phase 2: Relative Strength > Nifty 50',
        'Phase 2: ADX > 25',
      ],
      output: 'Shortlist of 5-15 high-potential candidates',
    },
    {
      id: 'analyst',
      name: 'AnalystAgent',
      icon: Brain,
      color: '#8b5cf6',
      role: 'The Decision-Maker',
      tasks: [
        'LLM-powered qualitative analysis (Phase 3)',
        'Evaluate pullback setups to EMA support',
        'Assess RSI reset zones (40-55)',
        'Verify volume characteristics',
        'Calculate entry/stop/target prices',
      ],
      output: 'Single best trade recommendation with rationale',
    },
    {
      id: 'execution',
      name: 'ExecutionAgent',
      icon: Zap,
      color: '#ef4444',
      role: 'The Trader',
      tasks: [
        'Pre-trade validation checks',
        'Position sizing (max 5-8% capital)',
        'Order placement via broker API',
        'Stop-loss and target management',
        'Trailing stop logic implementation',
      ],
      output: 'Executed trades with confirmation logs',
    },
  ]

  const communicationFlow = [
    { from: 'DataAgent', to: 'IndicatorAgent', artifact: 'Raw OHLCV data', method: 'S3 URI' },
    { from: 'IndicatorAgent', to: 'ScreenerAgent', artifact: 'Computed indicators', method: 'S3 URI' },
    { from: 'ScreenerAgent', to: 'AnalystAgent', artifact: 'Shortlisted stocks', method: 'S3 URI' },
    { from: 'AnalystAgent', to: 'ExecutionAgent', artifact: 'Trade recommendation', method: 'S3 URI' },
  ]

  return (
    <section id="agents" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Agentic Framework Design</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
            Modular, event-driven architecture with five specialized agents orchestrating autonomous execution of the Nifty Velocity Alpha momentum trading strategy.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">Multi-Agent Architecture</h3>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 mb-8">
            {agents.map((agent, index) => {
              const Icon = agent.icon
              const isHovered = hoveredAgent === agent.id
              return (
                <div key={agent.id} className="flex items-center gap-4">
                  <Card
                    className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 cursor-pointer"
                    style={{
                      borderColor: isHovered ? agent.color : undefined,
                    }}
                    onMouseEnter={() => setHoveredAgent(agent.id)}
                    onMouseLeave={() => setHoveredAgent(null)}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: `${agent.color}20`,
                          color: agent.color,
                        }}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{agent.name}</h4>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                      </div>
                    </div>
                  </Card>
                  {index < agents.length - 1 && (
                    <ArrowRight className="hidden lg:block w-6 h-6 text-muted-foreground" />
                  )}
                </div>
              )
            })}
          </div>
          <div className="text-center">
            <Badge variant="outline" className="text-sm">
              Orchestration Layer: Prefect / Airflow
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="agents">Agent Details</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="llm">LLM Integration</TabsTrigger>
          </TabsList>

          <TabsContent value="agents">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => {
                const Icon = agent.icon
                return (
                  <Card
                    key={agent.id}
                    className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: `${agent.color}20`,
                          color: agent.color,
                        }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold">{agent.name}</h4>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      <h5 className="text-sm font-semibold">Key Tasks:</h5>
                      <ul className="space-y-2">
                        {agent.tasks.map((task, index) => (
                          <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-accent mt-0.5">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        <strong>Output:</strong> {agent.output}
                      </p>
                    </div>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="communication">
            <Card className="p-8 bg-card/50 backdrop-blur border-border">
              <h3 className="text-2xl font-bold mb-6">Inter-Agent Communication Flow</h3>
              <p className="text-muted-foreground mb-8">
                Hybrid approach combining message passing with shared state persistence for scalability and auditability.
              </p>
              <div className="space-y-4">
                {communicationFlow.map((flow, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row items-center gap-4 p-5 rounded-lg bg-background border border-border hover:border-primary/50 transition-all duration-300"
                  >
                    <div className="flex-1 text-center md:text-left">
                      <Badge variant="outline" className="mb-2">
                        {flow.from}
                      </Badge>
                      <p className="text-sm text-muted-foreground">{flow.artifact}</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-primary" />
                    <div className="flex-1 text-center md:text-left">
                      <Badge variant="outline" className="mb-2">
                        {flow.to}
                      </Badge>
                      <p className="text-sm text-accent font-mono">{flow.method}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-6 bg-muted/30 rounded-lg border border-border">
                <h4 className="font-semibold mb-3">S3 URI Pattern</h4>
                <code className="text-sm text-primary">
                  s3://trading-data/{'{'}stage{'}'}/YYYY-MM-DD.{'{'}format{'}'}
                </code>
                <p className="text-sm text-muted-foreground mt-3">
                  All data artifacts are versioned and stored in S3 with standardized naming conventions for traceability.
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="llm">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-8 bg-card/50 backdrop-blur border-border">
                <h3 className="text-2xl font-bold mb-6">AnalystAgent LLM Integration</h3>
                <p className="text-muted-foreground mb-6">
                  GPT-4, Claude, or Gemini perform nuanced Phase 3 analysis using the Master Prompt template.
                </p>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Input Data Format</h4>
                    <code className="text-xs text-muted-foreground block p-3 bg-background rounded border border-border">
                      Ticker | CMP | 20EMA | 50EMA | RSI(14) | ATR | Sector | 1-Week % | Volume
                    </code>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Example</h4>
                    <code className="text-xs text-accent block p-3 bg-accent/10 rounded border border-accent/20">
                      TATASTEEL | 145 | 142 | 138 | 48 | 3.5 | Metals | -2% | Low Vol
                    </code>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-card/50 backdrop-blur border-border">
                <h3 className="text-2xl font-bold mb-6">Qualitative Logic</h3>
                <div className="space-y-4">
                  {[
                    'Reject: CMP < 50 EMA or RSI < 40 or RSI > 70',
                    'Select: Best setup with CMP closest to 20/50 EMA',
                    'Calculate: Stop Loss = Buy Price - (1.5 × ATR)',
                    'Calculate: Target = Buy Price + ((Buy - Stop) × 2)',
                    'Generate: 3-sentence technical rationale',
                  ].map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="mt-6 p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <h3 className="text-2xl font-bold mb-4">Orchestration Workflow</h3>
              <p className="text-muted-foreground mb-4">
                Prefect flow with automatic retries and error handling:
              </p>
              <pre className="text-xs bg-background p-4 rounded border border-border overflow-x-auto">
                <code className="text-muted-foreground">{`@flow(name="Nifty Velocity Alpha Strategy")
def trading_workflow():
    raw = data_collection_agent()          # Retries: 3
    indicators = indicator_agent(raw)      # Retries: 2
    shortlist = screener_agent(indicators)
    trade = analyst_agent_llm(shortlist)
    execution_log = execution_agent(trade) # Retries: 3
    
# Schedule: Daily at 3:15 PM IST post-market close`}</code>
              </pre>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
