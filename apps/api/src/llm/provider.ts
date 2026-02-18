import type { z } from 'zod';

export interface LLMResponse<T> {
  data: T;
  model: string;
  tokensUsed: { input: number; output: number };
  latencyMs: number;
}

export interface LLMProvider {
  name: string;
  analyze<T>(prompt: string, schema: z.ZodSchema<T>): Promise<LLMResponse<T>>;
}
