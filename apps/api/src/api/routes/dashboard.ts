import type { FastifyInstance } from 'fastify';
import { getDb } from '../../db/client';
import { positions, portfolioSnapshots, orders } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/portfolio', async () => {
    const db = getDb();

    const openPositions = await db
      .select()
      .from(positions)
      .where(eq(positions.status, 'open'));

    const latestSnapshot = await db
      .select()
      .from(portfolioSnapshots)
      .orderBy(desc(portfolioSnapshots.date))
      .limit(1);

    const recentOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.placedAt))
      .limit(20);

    return {
      positions: openPositions,
      snapshot: latestSnapshot[0] ?? null,
      recentOrders,
    };
  });

  app.get('/snapshot', async () => {
    const db = getDb();

    const snapshots = await db
      .select()
      .from(portfolioSnapshots)
      .orderBy(desc(portfolioSnapshots.date))
      .limit(30);

    return { snapshots };
  });

  app.get('/equity-curve', async () => {
    const db = getDb();

    const curve = await db
      .select({
        date: portfolioSnapshots.date,
        equity: portfolioSnapshots.totalEquity,
        drawdown: portfolioSnapshots.drawdownPercent,
      })
      .from(portfolioSnapshots)
      .orderBy(portfolioSnapshots.date);

    return { curve };
  });
}
