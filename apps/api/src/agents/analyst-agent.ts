import type { AgentName, ScreenerOutput, BatchAnalysis, StockAnalysis } from '@amt/shared';
import type { DrizzleDB } from '../db/client';
import type { AgentBus } from './agent-bus';
import { BaseAgent } from './base-agent';
import { tradingSignals } from '../db/schema';
import { buildAnalystPrompt } from '../llm/prompts';
import { BatchAnalysisSchema } from '../llm/schemas';
import { logger } from '../utils/logger';

interface AnalystAgentInput {
  date: string;
}

/**
 * Abstraction for the LLM provider so the agent is not coupled to a
 * single vendor.  The orchestrator injects an implementation that may
 * fall back across providers (e.g. Claude -> OpenAI).
 */
export interface FallbackLLMChain {
  generate(prompt: string): Promise<string>;
}

/**
 * Stage 4 -- LLM-powered analysis.
 *
 * Reads screener output from the AgentBus, builds a structured prompt
 * for the LLM, parses + validates the response with Zod, persists
 * BUY signals to the `trading_signals` table, and publishes the full
 * analysis to the "analyst" stage.
 */
export class AnalystAgent extends BaseAgent {
  readonly name: AgentName = 'AnalystAgent';

  constructor(
    private readonly llmProvider: FallbackLLMChain,
    private readonly bus: AgentBus,
    private readonly db: DrizzleDB,
  ) {
    super();
  }

  protected async run(input: unknown): Promise<BatchAnalysis> {
    const { date } = input as AnalystAgentInput;

    // 1. Read screener output from bus
    const screenerOutput = await this.bus.getStageResult<ScreenerOutput>('screener', date);

    if (screenerOutput.candidates.length === 0) {
      const empty: BatchAnalysis = {
        date,
        analyses: [],
        summary: 'No screener candidates for analysis.',
        topPick: '',
      };
      await this.bus.publishResult('analyst', date, empty);
      return empty;
    }

    logger.info(
      { date, candidates: screenerOutput.candidates.length },
      'AnalystAgent: screener candidates loaded',
    );

    // 2. Build prompt and call LLM
    const prompt = buildAnalystPrompt(screenerOutput.candidates, date);
    const rawResponse = await this.llmProvider.generate(prompt);

    // 3. Parse and validate with Zod
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      // The LLM may return the JSON wrapped in markdown fences
      const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        throw new Error('AnalystAgent: LLM response is not valid JSON');
      }
    }

    const validated = BatchAnalysisSchema.parse(parsed);

    const batchAnalysis: BatchAnalysis = {
      date: validated.date,
      analyses: validated.analyses as StockAnalysis[],
      summary: validated.summary,
      topPick: validated.topPick,
    };

    logger.info(
      {
        date,
        totalAnalyses: batchAnalysis.analyses.length,
        buySignals: batchAnalysis.analyses.filter((a) => a.action === 'BUY').length,
      },
      'AnalystAgent: LLM analysis validated',
    );

    // 4. Persist BUY signals to trading_signals table
    const now = new Date().toISOString();
    const buySignals = batchAnalysis.analyses.filter((a) => a.action === 'BUY');

    for (const signal of buySignals) {
      // Find matching screener candidate for exchange info
      const candidate = screenerOutput.candidates.find(
        (c) => c.tradingsymbol === signal.ticker,
      );

      await this.db.insert(tradingSignals).values({
        date,
        tradingsymbol: signal.ticker,
        exchange: candidate?.exchange ?? 'NSE',
        cmp: signal.entry,
        action: signal.action,
        entry: signal.entry,
        stopLoss: signal.stopLoss,
        target: signal.target,
        confidence: signal.confidence,
        reasoning: signal.reasoning,
        phase: 'analyst',
        metadata: JSON.stringify({
          setupQuality: signal.setupQuality,
          keyRisks: signal.keyRisks,
          riskRewardRatio:
            signal.stopLoss > 0
              ? (signal.target - signal.entry) / (signal.entry - signal.stopLoss)
              : null,
        }),
        createdAt: now,
      });
    }

    logger.info(
      { date, persisted: buySignals.length },
      'AnalystAgent: BUY signals persisted to DB',
    );

    // 5. Publish to AgentBus
    await this.bus.publishResult('analyst', date, batchAnalysis);
    logger.info({ date }, 'AnalystAgent: analyst stage published');

    return batchAnalysis;
  }
}
