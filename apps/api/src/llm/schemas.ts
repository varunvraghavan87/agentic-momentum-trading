import { z } from 'zod';

export const StockAnalysisSchema = z.object({
  ticker: z.string(),
  action: z.enum(['BUY', 'SKIP']),
  confidence: z.number().min(0).max(1),
  entry: z.number(),
  stopLoss: z.number(),
  target: z.number(),
  reasoning: z.string(),
  setupQuality: z.enum(['A', 'B', 'C']),
  keyRisks: z.array(z.string()),
});

export const BatchAnalysisSchema = z.object({
  date: z.string(),
  analyses: z.array(StockAnalysisSchema),
  summary: z.string(),
  topPick: z.string(),
});

export type StockAnalysis = z.infer<typeof StockAnalysisSchema>;
export type BatchAnalysis = z.infer<typeof BatchAnalysisSchema>;
