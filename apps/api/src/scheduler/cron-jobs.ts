import cron from 'node-cron';
import type { DailyOrchestrator } from './orchestrator.js';
import { logger } from '../utils/logger.js';
import { todayIST } from '../utils/date.js';

/**
 * Register all recurring cron jobs for the trading system.
 *
 * Evening pipeline: 15:15 IST Mon-Fri (right after market close at 15:30,
 *   allowing a few minutes for settlement data to arrive).
 * Morning execution: 09:14 IST Mon-Fri (one minute before market open
 *   at 09:15, to place orders in the pre-open session).
 */
export function registerCronJobs(orchestrator: DailyOrchestrator): void {
  // Evening pipeline -- 15:15 IST, weekdays
  cron.schedule(
    '15 15 * * 1-5',
    async () => {
      const date = todayIST();
      logger.info({ date }, 'Cron: triggering evening pipeline');
      try {
        await orchestrator.runEveningPipeline(date);
      } catch (err) {
        logger.error({ err, date }, 'Cron: evening pipeline failed');
      }
    },
    { timezone: 'Asia/Kolkata' },
  );

  logger.info('Registered cron: evening pipeline at 15:15 IST (Mon-Fri)');

  // Morning execution -- 09:14 IST, weekdays
  cron.schedule(
    '14 9 * * 1-5',
    async () => {
      const date = todayIST();
      logger.info({ date }, 'Cron: triggering morning execution');
      try {
        await orchestrator.runMorningExecution(date);
      } catch (err) {
        logger.error({ err, date }, 'Cron: morning execution failed');
      }
    },
    { timezone: 'Asia/Kolkata' },
  );

  logger.info('Registered cron: morning execution at 09:14 IST (Mon-Fri)');
}
