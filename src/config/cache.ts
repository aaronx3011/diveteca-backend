import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;
let cachePath: string | null = null;

export function initCache(): void {
  if (db) return;
  cachePath = process.env.CACHE_PATH || path.join(__dirname, '../../data/cache.sqlite');
  db = new Database(cachePath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS cache_entries (
      cache_key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      cached_at INTEGER NOT NULL,
      ttl_seconds INTEGER NOT NULL DEFAULT 1800,
      last_successful_refresh INTEGER
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      created_at INTEGER NOT NULL,
       expires_at INTEGER NOT NULL,
       is_valid INTEGER NOT NULL DEFAULT 1,
       sync_status TEXT NOT NULL DEFAULT 'synced'
    );

    CREATE TABLE IF NOT EXISTS cache_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cached_users (
      username TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL DEFAULT 0,
      email TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL DEFAULT '',
      full_name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      cached_at INTEGER NOT NULL DEFAULT 0
    );
  `);

  try {
    db.exec(`ALTER TABLE cached_users ADD COLUMN user_id INTEGER`);
  } catch {
    // column already exists — ignore
  }
  try {
    db.exec(`ALTER TABLE sessions ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'synced'`);
  } catch {
    // column already exists — ignore
  }

  console.log(`SQLite cache initialized at ${cachePath}`);
}

export function getCachePath(): string {
  if (!cachePath) throw new Error('Cache not initialized. Call initCache() first.');
  return cachePath;
}

export function getCacheDb(): Database.Database {
  if (!db) {
    initCache();
  }
  return db!;
}
