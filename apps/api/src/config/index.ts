import { z } from 'zod';

const envSchema = z.object({
  TRADING_MODE: z.enum(['paper', 'live']).default('paper'),

  KITE_API_KEY: z.string().default(''),
  KITE_API_SECRET: z.string().default(''),
  KITE_ACCESS_TOKEN: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  LLM_PRIMARY: z.enum(['claude', 'openai']).default('claude'),

  DATABASE_PATH: z.string().default('./data/db/trading.db'),

  API_PORT: z.coerce.number().default(3001),
  API_HOST: z.string().default('0.0.0.0'),

  MAX_PORTFOLIO_DRAWDOWN: z.coerce.number().default(0.15),
  DAILY_LOSS_LIMIT: z.coerce.number().default(0.03),
  MAX_PER_TRADE_RISK: z.coerce.number().default(0.08),
  RISK_PER_TRADE: z.coerce.number().default(0.015),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(): AppConfig {
  return envSchema.parse(process.env);
}

export const config = loadConfig();
