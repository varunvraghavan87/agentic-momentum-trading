import { EventEmitter } from 'node:events';
import type { AgentResult, AgentName } from '@amt/shared';
import { logger } from '../utils/logger';

export abstract class BaseAgent extends EventEmitter {
  abstract readonly name: AgentName;

  /**
   * Public entry point. Wraps the concrete run() with timing,
   * lifecycle events, and error handling.
   */
  async execute(input: unknown): Promise<AgentResult> {
    const start = Date.now();

    this.emit('start', { agent: this.name, input, timestamp: new Date().toISOString() });
    logger.info({ agent: this.name }, `${this.name} starting`);

    try {
      const data = await this.run(input);
      const durationMs = Date.now() - start;

      const result: AgentResult = {
        agentName: this.name,
        status: 'success',
        data,
        timestamp: new Date().toISOString(),
        durationMs,
      };

      this.emit('complete', result);
      logger.info({ agent: this.name, durationMs }, `${this.name} completed`);
      return result;
    } catch (err) {
      const durationMs = Date.now() - start;
      const errorMessage = err instanceof Error ? err.message : String(err);

      const result: AgentResult = {
        agentName: this.name,
        status: 'error',
        error: errorMessage,
        timestamp: new Date().toISOString(),
        durationMs,
      };

      this.emit('error', result);
      logger.error({ agent: this.name, err, durationMs }, `${this.name} failed`);
      return result;
    }
  }

  /**
   * Concrete agents implement their logic here.
   */
  protected abstract run(input: unknown): Promise<unknown>;
}
