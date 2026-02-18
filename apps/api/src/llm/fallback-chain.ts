import type { z } from 'zod';
import { logger } from '../utils/logger';
import type { LLMProvider, LLMResponse } from './provider';

export class FallbackLLMChain implements LLMProvider {
  public readonly name = 'fallback-chain';
  private readonly providers: LLMProvider[];

  constructor(providers: LLMProvider[]) {
    if (providers.length === 0) {
      throw new Error('FallbackLLMChain requires at least one provider');
    }
    this.providers = providers;
  }

  async analyze<T>(prompt: string, schema: z.ZodSchema<T>): Promise<LLMResponse<T>> {
    const errors: Error[] = [];

    for (const provider of this.providers) {
      try {
        logger.info({ provider: provider.name }, 'Attempting LLM analysis');
        const result = await provider.analyze(prompt, schema);
        logger.info(
          { provider: provider.name, latencyMs: result.latencyMs },
          'LLM analysis succeeded',
        );
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(err);
        logger.warn(
          { provider: provider.name, error: err.message },
          'LLM provider failed, trying next',
        );
      }
    }

    const providerNames = this.providers.map((p) => p.name).join(', ');
    throw new Error(
      `All LLM providers failed [${providerNames}]: ${errors.map((e) => e.message).join('; ')}`,
    );
  }
}
