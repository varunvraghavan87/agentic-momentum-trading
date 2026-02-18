'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cloud, Server, Database, Activity, Zap, Container } from 'lucide-react'

export function CloudDeployment() {
  const infrastructure = [
    {
      icon: Server,
      title: 'Compute Infrastructure',
      service: 'GCP C3 Machine Types',
      specs: [
        'P99 latency: 18 microseconds',
        'Throughput: 4.7M messages/sec',
        'DPDK for optimized networking',
        'Compact placement policies',
      ],
      color: '#3b82f6',
    },
    {
      icon: Container,
      title: 'Containerization',
      service: 'Google Kubernetes Engine',
      specs: [
        'Docker containers for all agents',
        'Helm charts for deployment',
        'Horizontal Pod Autoscaler',
        'Cluster Autoscaler enabled',
      ],
      color: '#10b981',
    },
    {
      icon: Database,
      title: 'Database Setup',
      service: 'Cloud SQL for PostgreSQL',
      specs: [
        'TimescaleDB extension enabled',
        'HA with synchronous standby',
        'Automated daily backups',
        'Point-in-time recovery',
      ],
      color: '#f59e0b',
    },
  ]

  const monitoring = [
    {
      tool: 'Prometheus',
      purpose: 'Metrics Collection',
      metrics: ['Tick-to-trade latency', 'Message queue depths', 'Exchange connectivity'],
    },
    {
      tool: 'Grafana',
      purpose: 'Visualization',
      metrics: ['System health dashboards', 'Application performance', 'Trading KPIs'],
    },
    {
      tool: 'Alertmanager',
      purpose: 'Alert Routing',
      metrics: ['Pod crashes', 'High CPU usage', 'Abnormal rejection rates'],
    },
  ]

  const latencyBreakdown = [
    { component: 'Market Data Reception', latency: '50-200ms', percentage: 40 },
    { component: 'Agent Processing', latency: '10-30ms', percentage: 15 },
    { component: 'Database Queries', latency: '5-15ms', percentage: 10 },
    { component: 'LLM Analysis', latency: '500-2000ms', percentage: 70 },
    { component: 'Order Placement', latency: '20-50ms', percentage: 12 },
  ]

  return (
    <section id="cloud" className="py-24 px-6 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Cloud Deployment Architecture</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
            Production-grade infrastructure on Google Cloud Platform with sub-millisecond latency, high availability, and comprehensive monitoring.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">Infrastructure Components</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {infrastructure.map((component) => {
              const Icon = component.icon
              return (
                <Card
                  key={component.title}
                  className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: `${component.color}20`,
                        color: component.color,
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold">{component.title}</h4>
                      <Badge variant="outline" className="text-xs mt-1">
                        {component.service}
                      </Badge>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {component.specs.map((spec, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">System Latency Analysis</h3>
          <Card className="p-8 bg-card/50 backdrop-blur border-border">
            <div className="space-y-4">
              {latencyBreakdown.map((item) => (
                <div key={item.component} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{item.component}</span>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs font-mono">
                        {item.latency}
                      </Badge>
                    </div>
                  </div>
                  <div className="relative h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                <Zap className="w-4 h-4 inline mr-2 text-primary" />
                <strong>Total End-to-End Latency:</strong> ~600ms to 2.3 seconds depending on LLM analysis time. Non-LLM path achieves sub-200ms latency for critical order execution.
              </p>
            </div>
          </Card>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">Monitoring & Alerting Stack</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {monitoring.map((tool) => (
              <Card key={tool.tool} className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-6 h-6 text-primary" />
                  <div>
                    <h4 className="font-bold">{tool.tool}</h4>
                    <p className="text-xs text-muted-foreground">{tool.purpose}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {tool.metrics.map((metric, index) => (
                    <div key={index} className="text-sm p-2 rounded bg-background border border-border">
                      {metric}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <h3 className="text-2xl font-bold mb-6">Deployment Architecture Diagram</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 bg-background/50 border-border">
              <div className="flex items-center gap-2 mb-3">
                <Cloud className="w-5 h-5 text-primary" />
                <h4 className="font-bold text-sm">Data Ingestion Layer</h4>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• WebSocket connections</li>
                <li>• Redis buffering</li>
                <li>• DataAgent pods (3 replicas)</li>
              </ul>
            </Card>
            <Card className="p-6 bg-background/50 border-border">
              <div className="flex items-center gap-2 mb-3">
                <Server className="w-5 h-5 text-accent" />
                <h4 className="font-bold text-sm">Processing Layer</h4>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Indicator/Screener/Analyst agents</li>
                <li>• Horizontal scaling (2-5 pods)</li>
                <li>• GPU nodes for LLM</li>
              </ul>
            </Card>
            <Card className="p-6 bg-background/50 border-border">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-[#f59e0b]" />
                <h4 className="font-bold text-sm">Execution Layer</h4>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• ExecutionAgent (2 replicas)</li>
                <li>• Broker API gateway</li>
                <li>• Order management system</li>
              </ul>
            </Card>
          </div>
          <div className="p-4 bg-background/50 rounded-lg border border-border">
            <h5 className="font-semibold mb-2 text-sm">High Availability Features</h5>
            <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <strong>Database:</strong> Multi-AZ deployment with synchronous replication and automatic failover
              </div>
              <div>
                <strong>Compute:</strong> Pod anti-affinity rules ensure agents run on separate nodes
              </div>
              <div>
                <strong>Network:</strong> Load balancers with health checks and automatic traffic routing
              </div>
              <div>
                <strong>Backup:</strong> Daily snapshots retained for 30 days with geo-redundant storage
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
