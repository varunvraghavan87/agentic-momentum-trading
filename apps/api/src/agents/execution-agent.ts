import type {
  AgentName,
  BatchAnalysis,
  StockAnalysis,
  ExecutionResult,
  TradeExecution,
} from '@amt/shared';
import type { IBroker } from '../broker/types.js';
import type { DrizzleDB } from '../db/client.js';
import type { AgentBus } from './agent-bus.js';
import { BaseAgent } from './base-agent.js';
import { orders as ordersTable } from '../db/schema.js';
import { TRADING_CONSTANTS } from '../config/trading.js';
import { logger } from '../utils/logger.js';

interface ExecutionAgentInput {
  date: string;
}

/**
 * Abstraction for the risk manager so the agent can query portfolio
 * state (kill switch, drawdown, position count) without coupling to a
 * concrete implementation.
 */
export interface IRiskManager {
  isKillSwitchActive(): Promise<boolean>;
  canOpenNewPosition(): Promise<boolean>;
}

/**
 * Abstraction for the position sizer.
 */
export interface IPositionSizer {
  calculate(params: {
    entry: number;
    stopLoss: number;
    ticker: string;
  }): Promise<{ shares: number; riskAmount: number }>;
}

/**
 * Stage 5 -- Order execution.
 *
 * Reads BUY signals from the analyst stage, checks the kill switch,
 * verifies that the live price has not drifted more than 1 % from the
 * planned entry, sizes the position, and places a BUY + SL order pair
 * through the broker.  Every order is logged to the `orders` table.
 */
export class ExecutionAgent extends BaseAgent {
  readonly name: AgentName = 'ExecutionAgent';

  private static readonly MAX_PRICE_DRIFT = 0.01; // 1 %

  constructor(
    private readonly broker: IBroker,
    private readonly riskManager: IRiskManager,
    private readonly positionSizer: IPositionSizer,
    private readonly bus: AgentBus,
    private readonly db: DrizzleDB,
  ) {
    super();
  }

  protected async run(input: unknown): Promise<ExecutionResult> {
    const { date } = input as ExecutionAgentInput;
    const trades: TradeExecution[] = [];

    // 1. Kill-switch check
    const killSwitchActive = await this.riskManager.isKillSwitchActive();
    if (killSwitchActive) {
      logger.warn({ date }, 'ExecutionAgent: kill switch is active -- skipping all orders');
      const result: ExecutionResult = { trades, reason: 'kill_switch_active' };
      await this.bus.publishResult('execution', date, result);
      return result;
    }

    // 2. Read analyst output from bus
    const analystOutput = await this.bus.getStageResult<BatchAnalysis>('analyst', date);
    const buySignals = analystOutput.analyses.filter(
      (a: StockAnalysis) => a.action === 'BUY',
    );

    if (buySignals.length === 0) {
      logger.info({ date }, 'ExecutionAgent: no BUY signals to execute');
      const result: ExecutionResult = { trades };
      await this.bus.publishResult('execution', date, result);
      return result;
    }

    logger.info(
      { date, signalCount: buySignals.length },
      'ExecutionAgent: processing BUY signals',
    );

    // 3. Execute each signal
    for (const signal of buySignals) {
      try {
        // Check if we can open a new position
        const canOpen = await this.riskManager.canOpenNewPosition();
        if (!canOpen) {
          logger.warn(
            { ticker: signal.ticker },
            'ExecutionAgent: max positions reached, skipping',
          );
          continue;
        }

        // Fetch live price
        const key = `NSE:${signal.ticker}`;
        const ltpResult = await this.broker.getLTP([key]);
        const ltp = ltpResult[key]?.lastPrice;

        if (!ltp) {
          logger.warn({ ticker: signal.ticker }, 'ExecutionAgent: LTP unavailable');
          continue;
        }

        // Verify price has not drifted >1 % from planned entry
        const drift = Math.abs(ltp - signal.entry) / signal.entry;
        if (drift > ExecutionAgent.MAX_PRICE_DRIFT) {
          logger.warn(
            { ticker: signal.ticker, ltp, entry: signal.entry, drift: `${(drift * 100).toFixed(2)}%` },
            'ExecutionAgent: price drift exceeds 1 %, skipping',
          );
          continue;
        }

        // Size the position
        const sizing = await this.positionSizer.calculate({
          entry: signal.entry,
          stopLoss: signal.stopLoss,
          ticker: signal.ticker,
        });

        if (sizing.shares <= 0) {
          logger.warn({ ticker: signal.ticker }, 'ExecutionAgent: position size is zero');
          continue;
        }

        // Place BUY order
        const buyOrderId = await this.broker.placeOrder({
          tradingsymbol: signal.ticker,
          exchange: 'NSE',
          transactionType: 'BUY',
          orderType: 'LIMIT',
          product: 'CNC',
          quantity: sizing.shares,
          price: signal.entry,
          tag: TRADING_CONSTANTS.ALGO_TAG,
        });

        // Log BUY order to DB
        const now = new Date().toISOString();
        await this.db.insert(ordersTable).values({
          orderId: buyOrderId,
          tradingsymbol: signal.ticker,
          exchange: 'NSE',
          transactionType: 'BUY',
          orderType: 'LIMIT',
          product: 'CNC',
          quantity: sizing.shares,
          price: signal.entry,
          status: 'OPEN',
          mode: this.broker.mode,
          tag: TRADING_CONSTANTS.ALGO_TAG,
          placedAt: now,
          updatedAt: now,
        });

        // Place SL order
        let slOrderId: string | undefined;
        try {
          slOrderId = await this.broker.placeOrder({
            tradingsymbol: signal.ticker,
            exchange: 'NSE',
            transactionType: 'SELL',
            orderType: 'SL',
            product: 'CNC',
            quantity: sizing.shares,
            price: signal.stopLoss,
            triggerPrice: signal.stopLoss,
            tag: TRADING_CONSTANTS.ALGO_TAG,
          });

          // Log SL order to DB
          await this.db.insert(ordersTable).values({
            orderId: slOrderId,
            tradingsymbol: signal.ticker,
            exchange: 'NSE',
            transactionType: 'SELL',
            orderType: 'SL',
            product: 'CNC',
            quantity: sizing.shares,
            price: signal.stopLoss,
            triggerPrice: signal.stopLoss,
            status: 'OPEN',
            mode: this.broker.mode,
            tag: TRADING_CONSTANTS.ALGO_TAG,
            placedAt: now,
            updatedAt: now,
          });
        } catch (slErr) {
          logger.error(
            { ticker: signal.ticker, buyOrderId, err: slErr },
            'ExecutionAgent: failed to place SL order',
          );
        }

        trades.push({
          ticker: signal.ticker,
          orderId: buyOrderId,
          slOrderId,
          shares: sizing.shares,
          entry: signal.entry,
          stopLoss: signal.stopLoss,
          target: signal.target,
        });

        logger.info(
          {
            ticker: signal.ticker,
            buyOrderId,
            slOrderId,
            shares: sizing.shares,
            entry: signal.entry,
            stopLoss: signal.stopLoss,
            target: signal.target,
          },
          'ExecutionAgent: order pair placed',
        );
      } catch (err) {
        logger.error(
          { ticker: signal.ticker, err },
          'ExecutionAgent: failed to execute signal',
        );
      }
    }

    // 4. Publish to AgentBus
    const result: ExecutionResult = { trades };
    await this.bus.publishResult('execution', date, result);
    logger.info(
      { date, executedCount: trades.length },
      'ExecutionAgent: execution stage published',
    );

    return result;
  }
}
