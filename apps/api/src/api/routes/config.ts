import type { FastifyInstance } from 'fastify';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

let runtimeMode = config.TRADING_MODE;
let manualKillSwitch = false;

export function getRuntimeMode() {
  return runtimeMode;
}

export function isKillSwitchActive() {
  return manualKillSwitch;
}

export async function configRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return {
      tradingMode: runtimeMode,
      killSwitch: manualKillSwitch,
      riskPerTrade: config.RISK_PER_TRADE,
      maxPerTradeRisk: config.MAX_PER_TRADE_RISK,
      maxPortfolioDrawdown: config.MAX_PORTFOLIO_DRAWDOWN,
      dailyLossLimit: config.DAILY_LOSS_LIMIT,
    };
  });

  app.post('/mode', async (request) => {
    const { mode } = request.body as { mode?: 'paper' | 'live' };
    if (mode && (mode === 'paper' || mode === 'live')) {
      runtimeMode = mode;
      logger.info({ mode }, 'Trading mode changed');
      return { tradingMode: runtimeMode };
    }
    return { error: 'Invalid mode. Use "paper" or "live".' };
  });

  app.post('/kill-switch', async (request) => {
    const { active } = request.body as { active?: boolean };
    if (typeof active === 'boolean') {
      manualKillSwitch = active;
      logger.warn({ active }, 'Manual kill switch toggled');
      return { killSwitch: manualKillSwitch };
    }
    return { error: 'Provide { active: true/false }' };
  });
}
