import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function initCache(): void {
  const cachePath = process.env.CACHE_PATH || path.join(__dirname, '../../data/cache.sqlite');
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
      is_valid INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS cache_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  console.log(`SQLite cache initialized at ${cachePath}`);
}

export function getCacheDb(): Database.Database {
  if (!db) {
    throw new Error('Cache not initialized. Call initCache() first.');
  }
  return db;
}
