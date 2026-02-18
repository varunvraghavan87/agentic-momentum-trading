import type { FastifyInstance } from 'fastify';
import { getDb } from '../../db/client';
import { tradingSignals } from '../../db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { todayIST } from '../../utils/date';

export async function signalRoutes(app: FastifyInstance) {
  app.get('/today', async () => {
    const db = getDb();
    const today = todayIST();

    const signals = await db
      .select()
      .from(tradingSignals)
      .where(eq(tradingSignals.date, today))
      .orderBy(desc(tradingSignals.confidence));

    return { date: today, signals };
  });

  app.get('/history', async (request) => {
    const { from, to } = request.query as { from?: string; to?: string };
    const db = getDb();

    const conditions = [];
    if (from) conditions.push(gte(tradingSignals.date, from));
    if (to) conditions.push(lte(tradingSignals.date, to));

    const signals = await db
      .select()
      .from(tradingSignals)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tradingSignals.date))
      .limit(100);

    return { signals };
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const signal = await db
      .select()
      .from(tradingSignals)
      .where(eq(tradingSignals.id, parseInt(id)))
      .limit(1);

    return { signal: signal[0] ?? null };
  });
}
