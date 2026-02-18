import { EventEmitter } from 'node:events';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { logger } from '../utils/logger';

/**
 * Inter-agent communication bus.
 *
 * Uses EventEmitter for in-process pub/sub and filesystem-based state
 * so each pipeline stage can persist its output and downstream stages
 * can read it independently (or across process restarts).
 */
export class AgentBus extends EventEmitter {
  private readonly stateDir: string;

  constructor(stateDir = './data') {
    super();
    this.stateDir = stateDir;
  }

  /**
   * Write a stage result to disk and emit a completion event.
   *
   * File layout: `{stateDir}/{stage}/{date}.json`
   */
  async publishResult(stage: string, date: string, data: unknown): Promise<void> {
    const dir = join(this.stateDir, stage);
    await mkdir(dir, { recursive: true });

    const filePath = join(dir, `${date}.json`);
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    logger.debug({ stage, date, filePath }, 'AgentBus: result published');
    this.emit(`${stage}:complete`, { stage, date, data });
  }

  /**
   * Read a previously-published stage result from disk.
   */
  async getStageResult<T>(stage: string, date: string): Promise<T> {
    const dir = join(this.stateDir, stage);
    await mkdir(dir, { recursive: true });

    const filePath = join(dir, `${date}.json`);
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  }
}
