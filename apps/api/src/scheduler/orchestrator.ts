import type { BaseAgent } from '../agents/base-agent.js';
import { retryWithBackoff } from '../utils/retry.js';
import { logger, type Logger } from '../utils/logger.js';

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
  private log: Logger;

  constructor(
    dataAgent: BaseAgent,
    indicatorAgent: BaseAgent,
    screenerAgent: BaseAgent,
    analystAgent: BaseAgent,
    executionAgent: BaseAgent,
    log: Logger = logger,
  ) {
    this.dataAgent = dataAgent;
    this.indicatorAgent = indicatorAgent;
    this.screenerAgent = screenerAgent;
    this.analystAgent = analystAgent;
    this.executionAgent = executionAgent;
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
   * Placeholder -- will be extended to check stop-losses,
   * trailing stops, and intraday exit conditions.
   */
  async monitorOpenPositions(): Promise<void> {
    this.log.info('Position monitoring cycle starting');

    // TODO: Query open positions from DB
    // TODO: Fetch live prices via broker
    // TODO: Evaluate trailing stop / target hit conditions
    // TODO: Trigger exit orders when conditions are met

    this.log.info('Position monitoring cycle completed (no-op placeholder)');
  }
}
