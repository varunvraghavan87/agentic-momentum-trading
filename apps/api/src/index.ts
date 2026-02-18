import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { getDb } from './db/client.js';
import { healthRoutes } from './api/routes/health.js';
import { authRoutes } from './api/routes/auth.js';
import { dashboardRoutes } from './api/routes/dashboard.js';
import { signalRoutes } from './api/routes/signals.js';
import { backtestRoutes } from './api/routes/backtest.js';
import { configRoutes } from './api/routes/config.js';

// Agent framework
import { AgentBus } from './agents/agent-bus.js';
import { DataAgent } from './agents/data-agent.js';
import { IndicatorAgent } from './agents/indicator-agent.js';
import { ScreenerAgent } from './agents/screener-agent.js';
import { AnalystAgent } from './agents/analyst-agent.js';
import { ExecutionAgent } from './agents/execution-agent.js';

// Scheduler
import { DailyOrchestrator } from './scheduler/orchestrator.js';
import { registerCronJobs } from './scheduler/cron-jobs.js';

// Broker
import { PaperBroker } from './broker/paper-broker.js';
import { KiteClient } from './broker/kite-client.js';
import type { IBroker } from './broker/types.js';

// LLM
import { FallbackLLMChain } from './llm/fallback-chain.js';
import { ClaudeProvider } from './llm/claude-provider.js';
import { OpenAIProvider } from './llm/openai-provider.js';
import type { LLMProvider } from './llm/provider.js';

// Risk
import { PositionSizer } from './risk/position-sizer.js';
import { PortfolioGuard } from './risk/portfolio-guard.js';

// Indicators
import { IndicatorCalculator } from './indicators/calculator.js';

// Data services
import * as instrumentService from './data/instrument-service.js';
import * as marketDataService from './data/market-data-service.js';

async function main() {
  const app = Fastify({
    logger: false,
  });

  // ─── CORS ───
  await app.register(cors, {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.WEB_URL || '',
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // ─── Register API routes ───
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await app.register(signalRoutes, { prefix: '/api/signals' });
  await app.register(backtestRoutes, { prefix: '/api/backtest' });
  await app.register(configRoutes, { prefix: '/api/config' });

  // ─── Initialize database ───
  const db = getDb();
  logger.info({ path: config.DATABASE_PATH }, 'Database initialized');

  // ─── Create Broker ───
  let broker: IBroker;
  let kiteClient: KiteClient | null = null;

  if (config.TRADING_MODE === 'live' && config.KITE_API_KEY && config.KITE_API_SECRET) {
    kiteClient = new KiteClient(config.KITE_API_KEY, config.KITE_API_SECRET);
    broker = kiteClient;
    logger.info('Broker: KiteClient (LIVE mode)');
  } else {
    broker = new PaperBroker();
    logger.info('Broker: PaperBroker (PAPER mode)');
  }

  // ─── Create LLM Chain ───
  const llmProviders: LLMProvider[] = [];

  if (config.ANTHROPIC_API_KEY) {
    llmProviders.push(new ClaudeProvider(config.ANTHROPIC_API_KEY));
    logger.info('LLM: Claude provider registered');
  }
  if (config.OPENAI_API_KEY) {
    llmProviders.push(new OpenAIProvider(config.OPENAI_API_KEY));
    logger.info('LLM: OpenAI provider registered');
  }

  // Fallback LLM chain that implements the FallbackLLMChain interface for AnalystAgent
  // AnalystAgent expects { generate(prompt): Promise<string> }
  // FallbackLLMChain class implements LLMProvider { analyze(prompt, schema) }
  // We create an adapter that wraps the chain
  let llmChain: { generate(prompt: string): Promise<string> };

  if (llmProviders.length > 0) {
    const chain = new FallbackLLMChain(llmProviders);
    llmChain = {
      async generate(prompt: string): Promise<string> {
        // Use the chain's analyze method with a passthrough approach
        // Since AnalystAgent parses JSON itself, we need raw string output
        // We call the providers directly for raw generation
        const errors: Error[] = [];
        for (const provider of llmProviders) {
          try {
            if (provider.name === 'claude') {
              const Anthropic = (await import('@anthropic-ai/sdk')).default;
              const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY! });
              const response = await client.messages.create({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }],
              });
              const textBlock = response.content.find((b: any) => b.type === 'text');
              if (textBlock && 'text' in textBlock) return textBlock.text;
              throw new Error('No text block in Claude response');
            }
            if (provider.name === 'openai') {
              const OpenAI = (await import('openai')).default;
              const client = new OpenAI({ apiKey: config.OPENAI_API_KEY! });
              const response = await client.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                  { role: 'system', content: 'You are a professional stock analyst. Respond with structured JSON.' },
                  { role: 'user', content: prompt },
                ],
                response_format: { type: 'json_object' },
              });
              return response.choices[0]?.message?.content ?? '{}';
            }
          } catch (err) {
            errors.push(err instanceof Error ? err : new Error(String(err)));
            logger.warn({ provider: provider.name, error: (err as Error).message }, 'LLM provider failed');
          }
        }
        throw new Error(`All LLM providers failed: ${errors.map((e) => e.message).join('; ')}`);
      },
    };
    logger.info({ providers: llmProviders.map((p) => p.name) }, 'LLM chain initialized');
  } else {
    // No LLM providers configured — return empty analysis
    llmChain = {
      async generate(_prompt: string): Promise<string> {
        logger.warn('No LLM providers configured — returning empty analysis');
        return JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          analyses: [],
          summary: 'No LLM providers configured',
          topPick: '',
        });
      },
    };
    logger.warn('No LLM API keys configured — AnalystAgent will return empty results');
  }

  // ─── Create Risk Management ───
  const portfolioGuard = new PortfolioGuard(db, config);
  const positionSizer = new PositionSizer(
    config.RISK_PER_TRADE,
    config.MAX_PER_TRADE_RISK,
  );

  // Adapter for IRiskManager interface expected by ExecutionAgent
  const riskManager = {
    async isKillSwitchActive(): Promise<boolean> {
      const result = await portfolioGuard.checkKillSwitch();
      return result.active;
    },
    async canOpenNewPosition(): Promise<boolean> {
      // Allow up to 10 concurrent open positions
      const state = await portfolioGuard.getPortfolioState();
      return state.openPositionCount < 10;
    },
  };

  // Adapter for IPositionSizer interface expected by ExecutionAgent
  const positionSizerAdapter = {
    async calculate(params: { entry: number; stopLoss: number; ticker: string }) {
      const state = await portfolioGuard.getPortfolioState();
      const equity = state.equity || 1_000_000; // Default 10L for paper mode
      const shares = positionSizer.calculate(equity, params.entry, params.stopLoss);
      const riskAmount = shares * (params.entry - params.stopLoss);
      return { shares, riskAmount };
    },
  };

  // ─── Create Agent Bus ───
  const bus = new AgentBus('./data');

  // ─── Create Agents ───
  // DataAgent requires KiteClient for data fetching — wrap for paper mode
  const dataAgent = new DataAgent(
    instrumentService,
    {
      fetchEOD: async (token: number, from: string, to: string) => {
        if (kiteClient) {
          return kiteClient.getHistoricalData(token, from, to, 'day');
        }
        logger.debug({ token, from, to }, 'Paper mode: no historical data available');
        return [];
      },
    },
    bus,
    kiteClient as any, // null in paper mode — DataAgent will log errors gracefully
  );

  const calculator = new IndicatorCalculator();
  const indicatorAgent = new IndicatorAgent(
    calculator,
    db,
    bus,
    {
      fetchEOD: async (token: number, from: string, to: string) => {
        if (kiteClient) {
          return kiteClient.getHistoricalData(token, from, to, 'day');
        }
        return [];
      },
    },
  );

  const screenerAgent = new ScreenerAgent(db, bus, instrumentService);
  const analystAgent = new AnalystAgent(llmChain, bus, db);
  const executionAgent = new ExecutionAgent(
    broker,
    riskManager,
    positionSizerAdapter,
    bus,
    db,
  );

  // ─── Create Orchestrator & Register Cron Jobs ───
  const orchestrator = new DailyOrchestrator(
    dataAgent,
    indicatorAgent,
    screenerAgent,
    analystAgent,
    executionAgent,
    logger,
    { broker, db },
  );

  registerCronJobs(orchestrator);
  logger.info('Cron jobs registered');

  // ─── Store shared state for route handlers ───
  app.decorate('portfolioGuard', portfolioGuard);
  app.decorate('orchestrator', orchestrator);
  app.decorate('tradingMode', config.TRADING_MODE);
  app.decorate('cronRegistered', true);

  // ─── Graceful Shutdown ───
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal, cleaning up...');
    try {
      await app.close();
      logger.info('Fastify server closed');
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ─── Start Server ───
  try {
    await app.listen({ port: config.API_PORT, host: config.API_HOST });
    logger.info({
      port: config.API_PORT,
      mode: config.TRADING_MODE,
      env: config.NODE_ENV,
      llmProviders: llmProviders.map((p) => p.name),
      broker: broker.mode,
    }, 'AMT API server started');
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

main();
