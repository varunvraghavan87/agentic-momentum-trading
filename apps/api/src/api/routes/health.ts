import type { FastifyInstance } from 'fastify';
import { config } from '../../config/index';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    // DB connectivity check
    let dbStatus = 'disconnected';
    try {
      const { getDb } = await import('../../db/client.js');
      const db = getDb();
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: '0.1.0',
      mode: config.TRADING_MODE,
      db: dbStatus,
      memory: {
        rss: Math.floor(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      cron: true,
    };
  });
}
