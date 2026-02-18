'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Play, CheckCircle2, AlertCircle } from 'lucide-react'

export function AutomationWorkflow() {
  const workflowSteps = [
    {
      time: '15:15 IST',
      stage: 'Market Close',
      agent: 'DataAgent',
      action: 'Fetch end-of-day data',
      duration: '2-5 minutes',
      status: 'success',
    },
    {
      time: '15:20 IST',
      stage: 'Indicator Calculation',
      agent: 'IndicatorAgent',
      action: 'Compute technical indicators',
      duration: '3-7 minutes',
      status: 'success',
    },
    {
      time: '15:27 IST',
      stage: 'Screening',
      agent: 'ScreenerAgent',
      action: 'Apply Phase 1 & 2 filters',
      duration: '1-2 minutes',
      status: 'success',
    },
    {
      time: '15:29 IST',
      stage: 'Analysis',
      agent: 'AnalystAgent',
      action: 'LLM qualitative analysis',
      duration: '2-4 minutes',
      status: 'success',
    },
    {
      time: '09:14 IST',
      stage: 'Pre-Market',
      agent: 'ExecutionAgent',
      action: 'Pre-trade validation',
      duration: '1 minute',
      status: 'pending',
    },
    {
      time: '09:15 IST',
      stage: 'Market Open',
      agent: 'ExecutionAgent',
      action: 'Order placement',
      duration: '< 1 second',
      status: 'pending',
    },
    {
      time: '09:15+ IST',
      stage: 'Monitoring',
      agent: 'ExecutionAgent',
      action: 'Position & stop-loss tracking',
      duration: 'Continuous',
      status: 'active',
    },
  ]

  const errorHandling = [
    {
      error: 'Data Fetch Failure',
      response: 'Retry with exponential backoff (3 attempts)',
      fallback: 'Alert ops team, skip day',
    },
    {
      error: 'LLM API Timeout',
      response: 'Extend timeout to 60s, retry once',
      fallback: 'Use rule-based fallback logic',
    },
    {
      error: 'Broker API Down',
      response: 'Switch to backup broker connection',
      fallback: 'Manual intervention alert',
    },
    {
      error: 'Order Rejection',
      response: 'Log reason, check margin/limits',
      fallback: 'Skip trade, continue monitoring',
    },
  ]

  return (
    <section id="automation" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Complete Automation Workflow</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
            End-to-end automated workflow orchestrating daily strategy execution from market close analysis to next-day trade placement and monitoring.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">Daily Execution Timeline</h3>
          <div className="relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-border"></div>
            <div className="space-y-8">
              {workflowSteps.map((step, index) => (
                <div
                  key={index}
                  className={`relative flex items-start gap-6 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  <div
                    className={`flex-1 ${
                      index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'
                    } hidden md:block`}
                  >
                    <Badge variant="outline" className="mb-2">
                      {step.agent}
                    </Badge>
                    <h4 className="font-bold text-lg mb-1">{step.stage}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{step.action}</p>
                    <span className="text-xs text-muted-foreground">Duration: {step.duration}</span>
                  </div>

                  <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 z-10">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-background ${
                        step.status === 'success'
                          ? 'bg-accent text-accent-foreground'
                          : step.status === 'pending'
                            ? 'bg-[#f59e0b] text-white'
                            : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      {step.status === 'success' ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : step.status === 'pending' ? (
                        <Clock className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </div>
                  </div>

                  <Card
                    className={`flex-1 p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors ml-28 md:ml-0 ${
                      index % 2 === 0 ? 'md:pl-12' : 'md:pr-12'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        {step.time}
                      </Badge>
                      <Badge variant="outline" className="md:hidden">
                        {step.agent}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-lg mb-1 md:hidden">{step.stage}</h4>
                    <p className="text-sm text-muted-foreground md:hidden mb-2">{step.action}</p>
                    <span className="text-xs text-muted-foreground md:hidden">
                      Duration: {step.duration}
                    </span>
                    <div className="hidden md:block text-sm text-muted-foreground">
                      Process initiated at market {step.stage.toLowerCase()}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">Scheduling Configuration</h3>
          <Card className="p-8 bg-card/50 backdrop-blur border-border">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Prefect CronSchedule
                </h4>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <p className="text-sm font-semibold mb-1">Post-Market Analysis</p>
                    <code className="text-xs text-primary">0 15 * * 1-5</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Daily at 3:00 PM IST, Monday-Friday
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <p className="text-sm font-semibold mb-1">Pre-Market Setup</p>
                    <code className="text-xs text-primary">14 9 * * 1-5</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Daily at 9:14 AM IST for validation
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-4">Environment Variables</h4>
                <div className="space-y-2 text-sm font-mono">
                  <div className="p-3 rounded bg-background border border-border">
                    <span className="text-accent">KITE_API_KEY</span>=your_api_key
                  </div>
                  <div className="p-3 rounded bg-background border border-border">
                    <span className="text-accent">KITE_ACCESS_TOKEN</span>=daily_token
                  </div>
                  <div className="p-3 rounded bg-background border border-border">
                    <span className="text-accent">LLM_API_KEY</span>=openai_key
                  </div>
                  <div className="p-3 rounded bg-background border border-border">
                    <span className="text-accent">DB_CONNECTION</span>=postgres://...
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-8 text-center">Error Handling Matrix</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {errorHandling.map((item) => (
              <Card
                key={item.error}
                className="p-6 bg-card/50 backdrop-blur border-border hover:border-destructive/50 transition-colors"
              >
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-bold mb-3">{item.error}</h4>
                    <div className="space-y-3">
                      <div>
                        <Badge variant="outline" className="mb-2 text-xs">
                          Primary Response
                        </Badge>
                        <p className="text-sm text-muted-foreground">{item.response}</p>
                      </div>
                      <div>
                        <Badge className="mb-2 text-xs bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30">
                          Fallback Action
                        </Badge>
                        <p className="text-sm text-muted-foreground">{item.fallback}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card className="mt-12 p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <h3 className="text-2xl font-bold mb-4">Workflow Integration Summary</h3>
          <p className="text-muted-foreground mb-6">
            The complete automation workflow integrates all system components into a seamless daily operation cycle. Each agent executes its specialized function within the orchestration framework, with comprehensive error handling and monitoring ensuring reliable unattended operation.
          </p>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="p-4 bg-background/50 rounded-lg border border-border text-center">
              <p className="font-bold text-2xl text-primary mb-1">100%</p>
              <p className="text-xs text-muted-foreground">Automated Execution</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg border border-border text-center">
              <p className="font-bold text-2xl text-accent mb-1">24/7</p>
              <p className="text-xs text-muted-foreground">Monitoring & Alerts</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg border border-border text-center">
              <p className="font-bold text-2xl text-[#f59e0b] mb-1">{'<'}15min</p>
              <p className="text-xs text-muted-foreground">Analysis to Decision</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg border border-border text-center">
              <p className="font-bold text-2xl text-primary mb-1">3</p>
              <p className="text-xs text-muted-foreground">Retry Attempts</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
