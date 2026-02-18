import type { FastifyInstance } from 'fastify';
import { getDb } from '../../db/client.js';
import { backtestRuns } from '../../db/schema.js';
import { desc, eq } from 'drizzle-orm';

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

  app.post('/run', async (request) => {
    const body = request.body as {
      name?: string;
      startDate?: string;
      endDate?: string;
      initialCapital?: number;
    };

    if (!body.startDate || !body.endDate) {
      return { error: 'startDate and endDate are required' };
    }

    // Backtest execution is placeholder — will be wired to BacktestEngine
    return {
      status: 'queued',
      message: 'Backtest has been queued for execution',
      config: {
        name: body.name ?? 'Unnamed Backtest',
        startDate: body.startDate,
        endDate: body.endDate,
        initialCapital: body.initialCapital ?? 1000000,
      },
    };
  });
}
