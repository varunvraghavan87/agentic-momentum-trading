import { eq, and, inArray } from 'drizzle-orm';
import type { KiteClient } from '../broker/kite-client';
import { getDb } from '../db/client';
import { instruments } from '../db/schema';
import { logger } from '../utils/logger';
import type { Instrument } from '@amt/shared';

/**
 * Refresh the full instrument master list from Kite Connect (NSE exchange).
 * Replaces existing rows for each instrument based on instrumentToken.
 */
export async function refreshInstruments(kite: KiteClient): Promise<number> {
  const db = getDb();
  const raw = await kite.getInstruments('NSE');

  logger.info({ count: raw.length }, 'Fetched NSE instrument list from Kite');

  const now = new Date().toISOString();
  let upserted = 0;

  for (const inst of raw) {
    await db
      .insert(instruments)
      .values({
        instrumentToken: inst.instrument_token,
        exchangeToken: inst.exchange_token,
        tradingsymbol: inst.tradingsymbol,
        name: inst.name || null,
        exchange: inst.exchange,
        segment: inst.segment || null,
        instrumentType: inst.instrument_type || null,
        lotSize: inst.lot_size ?? 1,
        tickSize: inst.tick_size ?? 0.05,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: instruments.instrumentToken,
        set: {
          tradingsymbol: inst.tradingsymbol,
          name: inst.name || null,
          exchange: inst.exchange,
          segment: inst.segment || null,
          instrumentType: inst.instrument_type || null,
          lotSize: inst.lot_size ?? 1,
          tickSize: inst.tick_size ?? 0.05,
          updatedAt: now,
        },
      });
    upserted++;
  }

  logger.info({ upserted }, 'Instrument master list refreshed');
  return upserted;
}

/**
 * Get all instruments flagged as Nifty 500 constituents.
 */
export async function getNifty500(): Promise<Instrument[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(instruments)
    .where(eq(instruments.isNifty500, true));

  return rows.map(mapRowToInstrument);
}

/**
 * Look up a single instrument by its tradingsymbol.
 */
export async function getBySymbol(symbol: string): Promise<Instrument | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(instruments)
    .where(
      and(
        eq(instruments.tradingsymbol, symbol),
        eq(instruments.exchange, 'NSE'),
      ),
    )
    .limit(1);

  return rows.length > 0 ? mapRowToInstrument(rows[0]) : undefined;
}

/**
 * Look up a single instrument by its instrument token.
 */
export async function getByToken(token: number): Promise<Instrument | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(instruments)
    .where(eq(instruments.instrumentToken, token))
    .limit(1);

  return rows.length > 0 ? mapRowToInstrument(rows[0]) : undefined;
}

/**
 * Mark a list of symbols as ASM or GSM flagged.
 */
export async function markASMGSM(
  symbols: string[],
  flag: 'asm' | 'gsm',
): Promise<void> {
  if (symbols.length === 0) return;

  const db = getDb();
  const now = new Date().toISOString();

  if (flag === 'asm') {
    await db
      .update(instruments)
      .set({ isASM: true, updatedAt: now })
      .where(inArray(instruments.tradingsymbol, symbols));
  } else {
    await db
      .update(instruments)
      .set({ isGSM: true, updatedAt: now })
      .where(inArray(instruments.tradingsymbol, symbols));
  }

  logger.info({ flag, count: symbols.length }, 'Instruments marked as ASM/GSM');
}

/**
 * Map a database row to the shared Instrument type.
 */
function mapRowToInstrument(row: typeof instruments.$inferSelect): Instrument {
  return {
    instrumentToken: row.instrumentToken,
    exchangeToken: row.exchangeToken ?? 0,
    tradingsymbol: row.tradingsymbol,
    name: row.name ?? '',
    exchange: row.exchange as Instrument['exchange'],
    segment: row.segment ?? '',
    instrumentType: row.instrumentType ?? '',
    lotSize: row.lotSize ?? 1,
    tickSize: row.tickSize ?? 0.05,
    isNifty500: row.isNifty500 ?? false,
    sector: row.sector ?? undefined,
    marketCap: row.marketCap ?? undefined,
    isASM: row.isASM ?? false,
    isGSM: row.isGSM ?? false,
  };
}
