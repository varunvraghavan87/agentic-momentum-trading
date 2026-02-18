import type { ScreenerCandidate } from '@amt/shared';

export function buildAnalystPrompt(candidates: ScreenerCandidate[]): string {
  const today = new Date().toISOString().split('T')[0];

  const rules = `You are a swing-trading analyst for Indian equities (NSE/BSE).
Evaluate each candidate stock and provide a structured recommendation.

## Hard Rejection Rules
- REJECT if CMP < 50 EMA (price below 50-period EMA indicates downtrend)
- REJECT if RSI(14) < 40 (oversold / weak momentum)
- REJECT if RSI(14) > 70 (overbought / extended)

## Preference Rules
- PREFER stocks whose CMP is closest to 20 EMA or 50 EMA (mean-reversion / support bounce)
- Higher ADX (>25) indicates stronger trend — prefer these setups
- Volume ratio > 1.5 indicates institutional interest — prefer these

## Position Sizing Rules
- Stop Loss = Entry - 1.5 * ATR(14)
- Target = Entry + 2 * (Entry - Stop Loss)
- This gives a minimum 2:1 risk-reward ratio

## Quality Grading
- A-setup: All indicators aligned, strong trend (ADX>30), volume confirmation, near key EMA
- B-setup: Most indicators aligned, moderate trend, acceptable volume
- C-setup: Marginal setup, consider skipping unless portfolio needs exposure

Analyze the following ${candidates.length} candidates for date ${today}:`;

  const tableHeader = `
| Ticker | CMP | 20EMA | 50EMA | RSI(14) | ADX(14) | ATR(14) | Sector | 1-Week % | VolRatio |
|--------|-----|-------|-------|---------|---------|---------|--------|----------|----------|`;

  const rows = candidates
    .map(
      (c) =>
        `| ${c.tradingsymbol} | ${c.cmp.toFixed(2)} | ${c.ema20.toFixed(2)} | ${c.ema50.toFixed(2)} | ${c.rsi14.toFixed(1)} | ${c.adx14.toFixed(1)} | ${c.atr14.toFixed(2)} | ${c.sector} | ${c.weeklyReturn.toFixed(2)}% | ${c.volumeRatio.toFixed(2)} |`,
    )
    .join('\n');

  const instructions = `

For each candidate, provide a structured recommendation with:
- ticker: The trading symbol
- action: "BUY" or "SKIP"
- confidence: A number between 0 and 1
- entry: Recommended entry price
- stopLoss: Calculated as entry - 1.5 * ATR
- target: Calculated as entry + 2 * (entry - stopLoss)
- reasoning: Brief explanation of your analysis
- setupQuality: "A", "B", or "C"
- keyRisks: Array of risk factors to watch

Also provide:
- date: "${today}"
- summary: Overall market assessment and batch summary
- topPick: Ticker of the best setup from the batch`;

  return `${rules}\n${tableHeader}\n${rows}\n${instructions}`;
}
