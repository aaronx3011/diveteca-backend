import { getCacheDb } from '../config/cache';
import { SessionCacheEntry } from '../types/cache';
import { ServiceUnavailableError } from '../utils/errors';
import { AsyncLocalStorage } from 'async_hooks';

const DEFAULT_TTL_SECONDS = 1800;
const MAX_STALE_SECONDS = Number(process.env.CACHE_MAX_STALE_SECONDS || 3600);
const CACHED_USER_TTL_SECONDS = Number(process.env.CACHED_USER_TTL_SECONDS || 86400);
const requestContext = new AsyncLocalStorage<{ stale: boolean }>();

export class CacheService {
  static get(key: string): { data: any; stale: boolean; age: number; ttl_seconds: number } | null {
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

    return { data: JSON.parse(row.data), stale, age, ttl_seconds: row.ttl_seconds };
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
    sync_status?: SessionCacheEntry['sync_status'];
  }): void {
    const db = getCacheDb();
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      INSERT INTO sessions (id, user_id, token, created_at, expires_at, is_valid, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        token = excluded.token,
        expires_at = excluded.expires_at,
        is_valid = excluded.is_valid,
        sync_status = excluded.sync_status
    `).run(sessionData.id, sessionData.user_id, token, now, sessionData.expires_at, sessionData.is_valid, sessionData.sync_status ?? 'pending_create');
  }

  static getSession(token: string): SessionCacheEntry | null {
    const db = getCacheDb();
    const row = db.prepare(`
      SELECT id, user_id, token, expires_at, is_valid, sync_status FROM sessions WHERE token = ?
    `).get(token) as SessionCacheEntry | undefined;

    if (!row) return null;
    return row;
  }

  static revokeCachedSession(token: string): void {
    const db = getCacheDb();
    db.prepare("UPDATE sessions SET is_valid = 0, sync_status = 'pending_revoke' WHERE token = ?").run(token);
  }

  static deleteAllUserSessions(userId: number): void {
    const db = getCacheDb();
    db.prepare("UPDATE sessions SET is_valid = 0, sync_status = 'pending_revoke' WHERE user_id = ?").run(userId.toString());
  }

  static runWithRequestContext<T>(callback: () => T): T {
    return requestContext.run({ stale: false }, callback);
  }

  static get lastHitWasStale(): boolean {
    return requestContext.getStore()?.stale ?? false;
  }

  static set lastHitWasStale(value: boolean) {
    const context = requestContext.getStore();
    if (context) context.stale = value;
  }

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
      if (cached && cached.age <= cachedAgeLimit(cached)) {
        console.warn(`Serving stale data for cache key: ${key}`);
        this.lastHitWasStale = true;
        return cached.data as T;
      }
      throw new ServiceUnavailableError('MSSQL is unavailable and no cached data exists');
    }
  }

  static cacheUser(user: {
    user_id: number;
    username: string;
    email: string;
    password_hash: string;
    full_name: string;
    role: string;
  }): void {
    const db = getCacheDb();
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      INSERT INTO cached_users (username, user_id, email, password_hash, full_name, role, cached_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        user_id = excluded.user_id,
        email = excluded.email,
        password_hash = excluded.password_hash,
        full_name = excluded.full_name,
        role = excluded.role,
        cached_at = excluded.cached_at
    `).run(user.username, user.user_id, user.email, user.password_hash, user.full_name, user.role, now);
  }

  static getCachedUser(username: string): {
    user_id: number;
    username: string;
    email: string;
    password_hash: string;
    full_name: string;
    role: string;
    cached_at: number;
  } | null {
    const db = getCacheDb();
    const row = db.prepare(`
      SELECT user_id, username, email, password_hash, full_name, role, cached_at
      FROM cached_users WHERE username = ?
    `).get(username) as any | undefined;
    if (!row || Math.floor(Date.now() / 1000) - row.cached_at > CACHED_USER_TTL_SECONDS) return null;
    return row;
  }

  static getCachedUserById(userId: number): {
    user_id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
  } | null {
    const db = getCacheDb();
    const row = db.prepare(`
      SELECT user_id, username, email, full_name, role
      FROM cached_users WHERE user_id = ?
    `).get(userId) as any | undefined;
    if (!row) return null;
    return row;
  }

  static buildCacheKey(serviceName: string, methodName: string, ...params: any[]): string {
    const paramParts = params.map(p => {
      if (p === null || p === undefined) return '';
      if (typeof p === 'object') return JSON.stringify(p);
      return String(p);
    });
    return `${serviceName}:${methodName}:${paramParts.join(':')}`;
  }

  static purgeExpired(): void {
    const db = getCacheDb();
    const now = Math.floor(Date.now() / 1000);
    db.prepare('DELETE FROM cache_entries WHERE cached_at + ttl_seconds + ? < ?').run(MAX_STALE_SECONDS, now);
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
    db.prepare('DELETE FROM cached_users WHERE cached_at + ? < ?').run(CACHED_USER_TTL_SECONDS, now);
  }

  static getPendingSessions(): SessionCacheEntry[] {
    const db = getCacheDb();
    return db.prepare("SELECT id, user_id, token, created_at, expires_at, is_valid, sync_status FROM sessions WHERE sync_status != 'synced'").all() as SessionCacheEntry[];
  }

  static markSessionSynced(token: string): void {
    getCacheDb().prepare("UPDATE sessions SET sync_status = 'synced' WHERE token = ?").run(token);
  }
}

function cachedAgeLimit(cached: { ttl_seconds: number }): number {
  return cached.ttl_seconds + MAX_STALE_SECONDS;
}
