import { z } from 'zod';
import type { LLMProvider, LLMResponse } from '../../llm/provider';

/**
 * Mock LLM provider for testing. Returns a pre-configured response
 * validated against the provided schema, and tracks all calls.
 */
export class MockLLMProvider implements LLMProvider {
  name = 'mock-llm';

  /** Record of all analyze() calls made to this mock */
  calls: { prompt: string }[] = [];

  /** The data that will be returned from analyze() */
  private responseData: unknown;

  constructor(responseData: unknown) {
    this.responseData = responseData;
  }

  async analyze<T>(
    prompt: string,
    schema: z.ZodSchema<T>
  ): Promise<LLMResponse<T>> {
    this.calls.push({ prompt });

    const data = schema.parse(this.responseData) as T;

    return {
      data,
      model: 'mock-model',
      tokensUsed: { input: 100, output: 50 },
      latencyMs: 10,
    };
  }

  /** Update the response data for subsequent calls */
  setResponseData(responseData: unknown): void {
    this.responseData = responseData;
  }

  /** Reset call tracking */
  reset(): void {
    this.calls = [];
  }
}
