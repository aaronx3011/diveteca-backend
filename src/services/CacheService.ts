import { getCacheDb } from '../config/cache';
import { ServiceUnavailableError } from '../utils/errors';

const DEFAULT_TTL_SECONDS = 1800;

export class CacheService {
  static get(key: string): { data: any; stale: boolean } | null {
    const db = getCacheDb();
    const row = db.prepare('SELECT data, cached_at, ttl_seconds FROM cache_entries WHERE cache_key = ?').get(key) as {
      data: string;
      cached_at: number;
      ttl_seconds: number;
    } | undefined;

    if (!row) return null;

    const now = Math.floor(Date.now() / 1000);
    const age = now - row.cached_at;
    const stale = age > row.ttl_seconds;

    return { data: JSON.parse(row.data), stale };
  }

  static set(key: string, data: any, ttlSeconds: number = DEFAULT_TTL_SECONDS): void {
    const db = getCacheDb();
    const now = Math.floor(Date.now() / 1000);
    const json = JSON.stringify(data);

    db.prepare(`
      INSERT INTO cache_entries (cache_key, data, cached_at, ttl_seconds, last_successful_refresh)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET
        data = excluded.data,
        cached_at = excluded.cached_at,
        ttl_seconds = excluded.ttl_seconds,
        last_successful_refresh = excluded.last_successful_refresh
    `).run(key, json, now, ttlSeconds, now);
  }

  static del(key: string): void {
    const db = getCacheDb();
    db.prepare('DELETE FROM cache_entries WHERE cache_key = ?').run(key);
  }

  static getMssqlAvailable(): boolean {
    const db = getCacheDb();
    const row = db.prepare("SELECT value FROM cache_metadata WHERE key = 'mssql_available'").get() as { value: string } | undefined;
    return row?.value === 'true';
  }

  static setMssqlAvailable(available: boolean): void {
    const db = getCacheDb();
    db.prepare(`
      INSERT INTO cache_metadata (key, value) VALUES ('mssql_available', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(available ? 'true' : 'false');
  }

  static getMssqlFailureCount(): number {
    const db = getCacheDb();
    const row = db.prepare("SELECT value FROM cache_metadata WHERE key = 'mssql_failure_count'").get() as { value: string } | undefined;
    return row ? parseInt(row.value, 10) : 0;
  }

  static incrementMssqlFailureCount(): void {
    const db = getCacheDb();
    const count = this.getMssqlFailureCount() + 1;
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      INSERT INTO cache_metadata (key, value) VALUES ('mssql_last_failure_at', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(now.toString());
    db.prepare(`
      INSERT INTO cache_metadata (key, value) VALUES ('mssql_failure_count', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(count.toString());
  }

  static resetMssqlFailureCount(): void {
    const db = getCacheDb();
    db.prepare(`
      INSERT INTO cache_metadata (key, value) VALUES ('mssql_failure_count', '0')
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run();
  }

  static shouldRetryMssql(): boolean {
    const db = getCacheDb();
    const count = this.getMssqlFailureCount();
    if (count === 0) return true;

    const row = db.prepare("SELECT value FROM cache_metadata WHERE key = 'mssql_last_failure_at'").get() as { value: string } | undefined;
    if (!row) return true;

    const lastFailure = parseInt(row.value, 10);
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - lastFailure;

    const backoff = Math.min(Math.pow(2, count), 300);
    return elapsed >= backoff;
  }

  static updateSession(token: string, sessionData: {
    id: string;
    user_id: string;
    expires_at: number;
    is_valid: number;
  }): void {
    const db = getCacheDb();
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      INSERT INTO sessions (id, user_id, token, created_at, expires_at, is_valid)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        token = excluded.token,
        expires_at = excluded.expires_at,
        is_valid = excluded.is_valid
    `).run(sessionData.id, sessionData.user_id, token, now, sessionData.expires_at, sessionData.is_valid);
  }

  static getSession(token: string): SessionData | null {
    const db = getCacheDb();
    const row = db.prepare(`
      SELECT id, user_id, token, expires_at, is_valid FROM sessions WHERE token = ?
    `).get(token) as SessionData | undefined;

    if (!row) return null;
    return row;
  }

  static deleteSession(token: string): void {
    const db = getCacheDb();
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  static deleteAllUserSessions(userId: number): void {
    const db = getCacheDb();
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId.toString());
  }

  static lastHitWasStale: boolean = false;

  static async cacheAside<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<T> {
    const cached = this.get(key);
    if (cached && !cached.stale) {
      return cached.data as T;
    }

    try {
      const data = await fetchFn();
      this.set(key, data, ttlSeconds);
      return data;
    } catch {
      if (cached) {
        console.warn(`Serving stale data for cache key: ${key}`);
        this.lastHitWasStale = true;
        return cached.data as T;
      }
      throw new ServiceUnavailableError('MSSQL is unavailable and no cached data exists');
    }
  }

  static buildCacheKey(serviceName: string, methodName: string, ...params: any[]): string {
    const paramParts = params.map(p => {
      if (p === null || p === undefined) return '';
      if (typeof p === 'object') return JSON.stringify(p);
      return String(p);
    });
    return `${serviceName}:${methodName}:${paramParts.join(':')}`;
  }
}

interface SessionData {
  id: string;
  user_id: string;
  token: string;
  expires_at: number;
  is_valid: number;
}
