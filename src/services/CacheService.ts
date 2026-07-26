import { getCacheDb } from '../config/cache';
import { SessionCacheEntry } from '../types/cache';
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

  static getSession(token: string): SessionCacheEntry | null {
    const db = getCacheDb();
    const row = db.prepare(`
      SELECT id, user_id, token, expires_at, is_valid FROM sessions WHERE token = ?
    `).get(token) as SessionCacheEntry | undefined;

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
