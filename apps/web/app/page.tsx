import { HeroSection } from '@/components/sections/hero-section'
import { ExecutiveSummary } from '@/components/sections/executive-summary'
import { FrameworkOverview } from '@/components/sections/framework-overview'
import { BacktestingSection } from '@/components/sections/backtesting-section'
import { DataInfrastructure } from '@/components/sections/data-infrastructure'
import { AgenticFramework } from '@/components/sections/agentic-framework'
import { RiskManagement } from '@/components/sections/risk-management'
import { BrokerIntegration } from '@/components/sections/broker-integration'
import { CloudDeployment } from '@/components/sections/cloud-deployment'
import { AutomationWorkflow } from '@/components/sections/automation-workflow'
import { Footer } from '@/components/sections/footer'

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <ExecutiveSummary />
      <FrameworkOverview />
      <BacktestingSection />
      <DataInfrastructure />
      <AgenticFramework />
      <RiskManagement />
      <BrokerIntegration />
      <CloudDeployment />
      <AutomationWorkflow />
      <Footer />
    </main>
  )
}
