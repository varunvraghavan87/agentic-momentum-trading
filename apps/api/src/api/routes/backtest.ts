import type { FastifyInstance } from 'fastify';
import { getDb } from '../../db/client.js';
import { backtestRuns } from '../../db/schema.js';
import { desc, eq } from 'drizzle-orm';
import { BacktestEngine } from '../../backtest/engine.js';
import { logger } from '../../utils/logger.js';

export async function backtestRoutes(app: FastifyInstance) {
  app.get('/list', async () => {
    const db = getDb();

    const runs = await db
      .select({
        id: backtestRuns.id,
        name: backtestRuns.name,
        startDate: backtestRuns.startDate,
        endDate: backtestRuns.endDate,
        initialCapital: backtestRuns.initialCapital,
        finalEquity: backtestRuns.finalEquity,
        cagr: backtestRuns.cagr,
        sharpeRatio: backtestRuns.sharpeRatio,
        maxDrawdown: backtestRuns.maxDrawdown,
        winRate: backtestRuns.winRate,
        totalTrades: backtestRuns.totalTrades,
        createdAt: backtestRuns.createdAt,
      })
      .from(backtestRuns)
      .orderBy(desc(backtestRuns.createdAt))
      .limit(20);

    return { runs };
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const run = await db
      .select()
      .from(backtestRuns)
      .where(eq(backtestRuns.id, parseInt(id)))
      .limit(1);

    return { run: run[0] ?? null };
  });

  app.post('/run', async (request, reply) => {
    const body = request.body as {
      name?: string;
      startDate?: string;
      endDate?: string;
      initialCapital?: number;
    };

    if (!body.startDate || !body.endDate) {
      return reply.status(400).send({ error: 'startDate and endDate are required' });
    }

    const backtestConfig = {
      name: body.name ?? `Backtest ${body.startDate} to ${body.endDate}`,
      startDate: body.startDate,
      endDate: body.endDate,
      initialCapital: body.initialCapital ?? 1_000_000,
    };

    try {
      const db = getDb();
      const engine = new BacktestEngine(db);
      const result = await engine.run(backtestConfig);

      return {
        status: 'completed',
        config: backtestConfig,
        metrics: {
          finalEquity: result.finalEquity,
          cagr: result.cagr,
          sharpeRatio: result.sharpeRatio,
          maxDrawdown: result.maxDrawdown,
          winRate: result.winRate,
          totalTrades: result.totalTrades,
        },
        equityCurve: result.equityCurve,
      };
    } catch (err) {
      logger.error({ err, config: backtestConfig }, 'Backtest failed');
      return reply.status(500).send({
        status: 'error',
        error: err instanceof Error ? err.message : 'Backtest execution failed',
        config: backtestConfig,
      });
    }
  });
}
