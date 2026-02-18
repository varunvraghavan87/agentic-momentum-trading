import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { config } from '../config/index';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

let db: ReturnType<typeof createDb>;

function createDb() {
  const dbPath = config.DATABASE_PATH;
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('foreign_keys = ON');

  return drizzle(sqlite, { schema });
}

export function getDb() {
  if (!db) {
    db = createDb();
  }
  return db;
}

export type DrizzleDB = ReturnType<typeof getDb>;
