import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../db/schema';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { unlinkSync } from 'fs';

/**
 * Creates a fresh SQLite test database with all 8 tables.
 * Each call produces a unique temp file. Call `cleanup()` in afterEach.
 */
export function createTestDb() {
  const dbPath = join(tmpdir(), `amt-test-${randomUUID()}.db`);
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  // Create all tables matching the Drizzle schema in src/db/schema.ts
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS instruments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instrument_token INTEGER NOT NULL UNIQUE,
      exchange_token INTEGER,
      tradingsymbol TEXT NOT NULL,
      name TEXT,
      exchange TEXT NOT NULL,
      segment TEXT,
      instrument_type TEXT,
      lot_size INTEGER DEFAULT 1,
      tick_size REAL DEFAULT 0.05,
      is_nifty500 INTEGER DEFAULT 0,
      sector TEXT,
      market_cap REAL,
      is_asm INTEGER DEFAULT 0,
      is_gsm INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_instruments_tradingsymbol ON instruments(tradingsymbol);
    CREATE INDEX IF NOT EXISTS idx_instruments_exchange ON instruments(exchange);

    CREATE TABLE IF NOT EXISTS market_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instrument_token INTEGER NOT NULL,
      tradingsymbol TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      open REAL NOT NULL,
      high REAL NOT NULL,
      low REAL NOT NULL,
      close REAL NOT NULL,
      volume INTEGER NOT NULL,
      oi INTEGER,
      interval TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_market_data_symbol_time ON market_data(tradingsymbol, timestamp);
    CREATE INDEX IF NOT EXISTS idx_market_data_token_interval ON market_data(instrument_token, interval, timestamp);

    CREATE TABLE IF NOT EXISTS indicator_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tradingsymbol TEXT NOT NULL,
      date TEXT NOT NULL,
      ema20 REAL,
      ema50 REAL,
      ema200 REAL,
      rsi14 REAL,
      adx14 REAL,
      atr14 REAL,
      weekly_return REAL,
      volume_ratio REAL,
      patterns TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_indicator_symbol_date ON indicator_snapshots(tradingsymbol, date);

    CREATE TABLE IF NOT EXISTS trading_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      tradingsymbol TEXT NOT NULL,
      exchange TEXT NOT NULL,
      cmp REAL NOT NULL,
      action TEXT NOT NULL,
      entry REAL,
      stop_loss REAL,
      target REAL,
      position_size INTEGER,
      risk_reward_ratio REAL,
      confidence REAL,
      reasoning TEXT,
      phase TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      tradingsymbol TEXT NOT NULL,
      exchange TEXT NOT NULL,
      transaction_type TEXT NOT NULL,
      order_type TEXT NOT NULL,
      product TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL,
      trigger_price REAL,
      status TEXT NOT NULL,
      mode TEXT NOT NULL,
      tag TEXT,
      parent_signal_id INTEGER,
      filled_quantity INTEGER,
      average_price REAL,
      status_message TEXT,
      placed_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tradingsymbol TEXT NOT NULL,
      exchange TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      average_entry REAL NOT NULL,
      current_price REAL,
      stop_loss REAL NOT NULL,
      target REAL NOT NULL,
      trailing_stop_active INTEGER DEFAULT 0,
      trailing_stop_price REAL,
      pnl REAL,
      pnl_percent REAL,
      mode TEXT NOT NULL,
      entry_order_id INTEGER,
      status TEXT NOT NULL,
      entered_at TEXT NOT NULL,
      closed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      total_equity REAL NOT NULL,
      daily_pnl REAL NOT NULL,
      daily_pnl_percent REAL NOT NULL,
      open_positions INTEGER NOT NULL,
      peak_equity REAL NOT NULL,
      drawdown REAL NOT NULL,
      drawdown_percent REAL NOT NULL,
      mode TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS backtest_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      initial_capital REAL NOT NULL,
      final_equity REAL,
      cagr REAL,
      sharpe_ratio REAL,
      max_drawdown REAL,
      win_rate REAL,
      total_trades INTEGER,
      config TEXT,
      results TEXT,
      created_at TEXT NOT NULL
    );
  `);

  const db = drizzle(sqlite, { schema });

  return {
    db,
    sqlite,
    dbPath,
    cleanup: () => {
      try { sqlite.close(); } catch { /* already closed */ }
      try { unlinkSync(dbPath); } catch { /* already deleted */ }
      try { unlinkSync(dbPath + '-wal'); } catch { /* WAL file */ }
      try { unlinkSync(dbPath + '-shm'); } catch { /* SHM file */ }
    },
  };
}

export type TestDb = ReturnType<typeof createTestDb>;
