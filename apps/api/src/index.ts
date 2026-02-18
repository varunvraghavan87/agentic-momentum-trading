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

async function main() {
  const app = Fastify({
    logger: false,
  });

  await app.register(cors, {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // Register routes
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await app.register(signalRoutes, { prefix: '/api/signals' });
  await app.register(backtestRoutes, { prefix: '/api/backtest' });
  await app.register(configRoutes, { prefix: '/api/config' });

  // Initialize database
  const db = getDb();
  logger.info({ path: config.DATABASE_PATH }, 'Database initialized');

  // Start server
  try {
    await app.listen({ port: config.API_PORT, host: config.API_HOST });
    logger.info({
      port: config.API_PORT,
      mode: config.TRADING_MODE,
      env: config.NODE_ENV,
    }, 'AMT API server started');
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

main();
