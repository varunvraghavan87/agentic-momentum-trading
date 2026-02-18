'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, Database, Brain, Shield, Cloud, Workflow } from 'lucide-react'

export function ExecutiveSummary() {
  const sections = [
    {
      icon: TrendingUp,
      title: 'Nifty Velocity Alpha Framework',
      href: '#framework',
      description: '4-phase momentum strategy with quantitative filters',
    },
    {
      icon: Database,
      title: 'Data Infrastructure',
      href: '#data',
      description: 'Real-time market data pipeline with TimescaleDB',
    },
    {
      icon: Brain,
      title: 'Agentic AI System',
      href: '#agents',
      description: '5 specialized agents with LLM-powered analysis',
    },
    {
      icon: Shield,
      title: 'Risk Management',
      href: '#risk',
      description: 'Position sizing, stop-loss, and SEBI compliance',
    },
    {
      icon: Cloud,
      title: 'Cloud Deployment',
      href: '#cloud',
      description: 'GCP infrastructure with sub-millisecond latency',
    },
    {
      icon: Workflow,
      title: 'Automation Workflow',
      href: '#automation',
      description: 'End-to-end orchestration with Prefect',
    },
  ]

  return (
    <section id="summary" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Executive Summary</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
            This guide provides a complete blueprint for implementing an AI-powered momentum trading system targeting Indian equities markets with institutional-grade infrastructure and risk controls.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-6 text-center">Key Takeaways</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
              <div className="text-3xl font-bold text-primary mb-2">1:2</div>
              <p className="text-muted-foreground">Minimum risk-reward ratio for all trades</p>
            </Card>
            <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
              <div className="text-3xl font-bold text-accent mb-2">₹20 Cr</div>
              <p className="text-muted-foreground">Minimum daily turnover threshold</p>
            </Card>
            <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
              <div className="text-3xl font-bold text-[#f59e0b] mb-2">8%</div>
              <p className="text-muted-foreground">Maximum capital risk per trade</p>
            </Card>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-8 text-center">Implementation Roadmap</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <a
                  key={section.title}
                  href={section.href}
                  className="group"
                >
                  <Card className="p-6 h-full bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                          {section.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
