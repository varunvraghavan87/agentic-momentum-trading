import { eq, desc } from 'drizzle-orm';
import type { BaseAgent } from '../agents/base-agent';
import type { IBroker } from '../broker/types';
import type { DrizzleDB } from '../db/client';
import { positions, indicatorSnapshots, orders } from '../db/schema';
import { TrailingStopManager } from '../risk/stop-loss';
import { retryWithBackoff } from '../utils/retry';
import { logger, type Logger } from '../utils/logger';

/**
 * DailyOrchestrator coordinates the sequential execution of agents
 * across the evening analysis pipeline and morning execution pipeline.
 */
export class DailyOrchestrator {
  private dataAgent: BaseAgent;
  private indicatorAgent: BaseAgent;
  private screenerAgent: BaseAgent;
  private analystAgent: BaseAgent;
  private executionAgent: BaseAgent;
  private broker?: IBroker;
  private db?: DrizzleDB;
  private trailingStopManager: TrailingStopManager;
  private log: Logger;

  constructor(
    dataAgent: BaseAgent,
    indicatorAgent: BaseAgent,
    screenerAgent: BaseAgent,
    analystAgent: BaseAgent,
    executionAgent: BaseAgent,
    log: Logger = logger,
    options?: { broker?: IBroker; db?: DrizzleDB },
  ) {
    this.dataAgent = dataAgent;
    this.indicatorAgent = indicatorAgent;
    this.screenerAgent = screenerAgent;
    this.analystAgent = analystAgent;
    this.executionAgent = executionAgent;
    this.broker = options?.broker;
    this.db = options?.db;
    this.trailingStopManager = new TrailingStopManager();
    this.log = log;
  }

  /**
   * Evening pipeline (runs after market close).
   * Sequence: DataAgent -> IndicatorAgent -> ScreenerAgent -> AnalystAgent
   *
   * Each step feeds its output into the next agent. If any step fails
   * after retries, the pipeline is aborted.
   */
  async runEveningPipeline(date: string): Promise<void> {
    this.log.info({ date }, 'Evening pipeline starting');
    const pipelineStart = Date.now();

    try {
      // Step 1: Fetch latest market data
      const dataResult = await retryWithBackoff(
        () => this.dataAgent.execute({ date }),
        'DataAgent',
      );
      if (dataResult.status === 'error') {
        throw new Error(`DataAgent failed: ${dataResult.error}`);
      }

      // Step 2: Compute technical indicators
      const indicatorResult = await retryWithBackoff(
        () => this.indicatorAgent.execute({ date, data: dataResult.data }),
        'IndicatorAgent',
      );
      if (indicatorResult.status === 'error') {
        throw new Error(`IndicatorAgent failed: ${indicatorResult.error}`);
      }

      // Step 3: Screen for candidates
      const screenerResult = await retryWithBackoff(
        () => this.screenerAgent.execute({ date, indicators: indicatorResult.data }),
        'ScreenerAgent',
      );
      if (screenerResult.status === 'error') {
        throw new Error(`ScreenerAgent failed: ${screenerResult.error}`);
      }

      // Step 4: Analyse candidates and generate signals
      const analystResult = await retryWithBackoff(
        () => this.analystAgent.execute({ date, candidates: screenerResult.data }),
        'AnalystAgent',
      );
      if (analystResult.status === 'error') {
        throw new Error(`AnalystAgent failed: ${analystResult.error}`);
      }

      const durationMs = Date.now() - pipelineStart;
      this.log.info({ date, durationMs }, 'Evening pipeline completed successfully');
    } catch (err) {
      const durationMs = Date.now() - pipelineStart;
      this.log.error({ date, err, durationMs }, 'Evening pipeline failed');
      throw err;
    }
  }

  /**
   * Morning execution (runs before market open).
   * Executes pending trading signals via the ExecutionAgent.
   */
  async runMorningExecution(date: string): Promise<void> {
    this.log.info({ date }, 'Morning execution starting');
    const start = Date.now();

    try {
      const result = await retryWithBackoff(
        () => this.executionAgent.execute({ date }),
        'ExecutionAgent',
      );

      if (result.status === 'error') {
        throw new Error(`ExecutionAgent failed: ${result.error}`);
      }

      const durationMs = Date.now() - start;
      this.log.info({ date, durationMs }, 'Morning execution completed successfully');
    } catch (err) {
      const durationMs = Date.now() - start;
      this.log.error({ date, err, durationMs }, 'Morning execution failed');
      throw err;
    }
  }

  /**
   * Monitor open positions during market hours.
   * Checks trailing stops, target hits, and stop-loss conditions
   * for all open positions and triggers exit orders when needed.
   */
  async monitorOpenPositions(): Promise<void> {
    if (!this.broker || !this.db) {
      this.log.info('Position monitoring skipped — broker or DB not configured');
      return;
    }

    this.log.info('Position monitoring cycle starting');

    try {
      // 1. Query open positions from DB
      const openPositions = await this.db
        .select()
        .from(positions)
        .where(eq(positions.status, 'open'));

      if (openPositions.length === 0) {
        this.log.debug('No open positions to monitor');
        return;
      }

      // 2. Fetch live prices for all open position instruments
      const instrumentKeys = openPositions.map(
        (p) => `${p.exchange}:${p.tradingsymbol}`,
      );
      const ltpData = await this.broker.getLTP(instrumentKeys);

      // 3. Fetch latest EMA20 for trailing stop evaluation
      const today = new Date().toISOString().split('T')[0];

      let exitCount = 0;
      let updateCount = 0;

      for (const position of openPositions) {
        const key = `${position.exchange}:${position.tradingsymbol}`;
        const ltp = ltpData[key]?.lastPrice;

        if (!ltp) {
          this.log.warn({ symbol: position.tradingsymbol }, 'No LTP available for position');
          continue;
        }

        // Get latest EMA20 for trailing stop logic
        const indicatorRows = await this.db
          .select({ ema20: indicatorSnapshots.ema20 })
          .from(indicatorSnapshots)
          .where(eq(indicatorSnapshots.tradingsymbol, position.tradingsymbol))
          .orderBy(desc(indicatorSnapshots.date))
          .limit(1);

        const currentEma20 = indicatorRows[0]?.ema20 ?? position.averageEntry;

        // 4. Evaluate stop conditions
        const action = this.trailingStopManager.evaluateStop(
          {
            averageEntry: position.averageEntry,
            stopLoss: position.stopLoss,
            target: position.target,
            trailingStopActive: position.trailingStopActive ?? false,
            trailingStopPrice: position.trailingStopPrice ?? undefined,
          },
          ltp,
          currentEma20,
        );

        if (action.action === 'exit') {
          // 5. Place exit (SELL) order
          this.log.info(
            { symbol: position.tradingsymbol, price: ltp, reason: action.reason },
            'Triggering exit order',
          );

          try {
            const orderId = await this.broker.placeOrder({
              tradingsymbol: position.tradingsymbol,
              exchange: position.exchange,
              transactionType: 'SELL',
              orderType: 'MARKET',
              product: 'CNC',
              quantity: position.quantity,
              tag: 'AMT001',
            });

            // Record exit order in DB
            await this.db.insert(orders).values({
              orderId,
              tradingsymbol: position.tradingsymbol,
              exchange: position.exchange,
              transactionType: 'SELL',
              orderType: 'MARKET',
              product: 'CNC',
              quantity: position.quantity,
              status: 'PLACED',
              mode: this.broker.mode,
              tag: 'AMT001',
              placedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            // Update position to closed
            const pnl = (ltp - position.averageEntry) * position.quantity;
            const pnlPercent = ((ltp - position.averageEntry) / position.averageEntry) * 100;

            await this.db
              .update(positions)
              .set({
                status: 'closed',
                currentPrice: ltp,
                pnl,
                pnlPercent,
                closedAt: new Date().toISOString(),
              })
              .where(eq(positions.id, position.id));

            exitCount++;
          } catch (err) {
            this.log.error(
              { symbol: position.tradingsymbol, err },
              'Failed to place exit order',
            );
          }
        } else if (action.action === 'move_stop') {
          // Update trailing stop in DB
          await this.db
            .update(positions)
            .set({
              trailingStopActive: action.activateTrailing ?? position.trailingStopActive,
              trailingStopPrice: action.newStopPrice,
              currentPrice: ltp,
            })
            .where(eq(positions.id, position.id));

          updateCount++;
          this.log.debug(
            { symbol: position.tradingsymbol, newStop: action.newStopPrice, reason: action.reason },
            'Trailing stop updated',
          );
        } else {
          // Hold — just update current price
          await this.db
            .update(positions)
            .set({ currentPrice: ltp })
            .where(eq(positions.id, position.id));
        }
      }

      this.log.info(
        { positions: openPositions.length, exits: exitCount, stopUpdates: updateCount },
        'Position monitoring cycle completed',
      );
    } catch (err) {
      this.log.error({ err }, 'Position monitoring cycle failed');
    }
  }
}
