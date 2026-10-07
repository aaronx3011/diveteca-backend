import { getPool } from '../config/database';
import { CacheService } from './CacheService';
import crypto from 'crypto';

export class SessionsService {
  static async createSession(userId: number, token: string, expiresAt: Date, ipAddress?: string, userAgent?: string) {
    CacheService.updateSession(token, {
      id: crypto.randomUUID(),
      user_id: userId.toString(),
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      is_valid: 1,
      sync_status: 'pending_create',
    });

    try {
      const pool = await getPool();
      const request = pool.request();
      request.input('userId', userId);
      request.input('token', token);
      request.input('expiresAt', expiresAt);
      request.input('ipAddress', ipAddress || null);
      request.input('userAgent', userAgent || null);

      const query = `
        INSERT INTO Sessions (user_id, token, expires_at, ip_address, user_agent)
        VALUES (@userId, @token, @expiresAt, @ipAddress, @userAgent)
      `;
      await request.query(query);
      CacheService.markSessionSynced(token);
    } catch {
      console.warn('MSSQL unavailable — session written to cache only');
    }
  }

  static async isSessionValid(token: string): Promise<boolean> {
    try {
      const pool = await getPool();
      const request = pool.request();
      request.input('token', token);
      const result = await request.query(`
        SELECT id FROM Sessions WHERE token = @token AND is_revoked = 0 AND expires_at > GETDATE()
      `);
      return result.recordset.length > 0;
    } catch {
      const cacheSession = CacheService.getSession(token);
      if (!cacheSession) return false;
      const now = Math.floor(Date.now() / 1000);
      return cacheSession.expires_at > now && cacheSession.is_valid === 1;
    }
  }

  static getSessionFromCache(token: string) {
    return CacheService.getSession(token);
  }

  static async revokeSession(token: string) {
    CacheService.revokeCachedSession(token);

    try {
      const pool = await getPool();
      const request = pool.request();
      request.input('token', token);

      await request.query(`
        UPDATE Sessions SET is_revoked = 1 WHERE token = @token
      `);
    } catch {
      console.warn('MSSQL unavailable — session revoked from cache only');
    }
  }

  static async reconcilePendingSessions(): Promise<void> {
    const pending = CacheService.getPendingSessions();
    if (!pending.length) return;
    const pool = await getPool();
    for (const session of pending) {
      const request = pool.request();
      request.input('token', session.token);
      if (session.sync_status === 'pending_revoke') {
        await request.query('UPDATE Sessions SET is_revoked = 1 WHERE token = @token');
      } else {
        request.input('userId', Number(session.user_id));
        request.input('expiresAt', new Date(session.expires_at * 1000));
        await request.query(`IF NOT EXISTS (SELECT 1 FROM Sessions WHERE token = @token)
          INSERT INTO Sessions (user_id, token, expires_at) VALUES (@userId, @token, @expiresAt)`);
      }
      CacheService.markSessionSynced(session.token);
    }
  }

  static async revokeAllUserSessions(userId: number, exceptToken?: string) {
    CacheService.deleteAllUserSessions(userId);

    try {
      const pool = await getPool();
      const request = pool.request();
      request.input('userId', userId);

      let query = `UPDATE Sessions SET is_revoked = 1 WHERE user_id = @userId`;
      if (exceptToken) {
        request.input('exceptToken', exceptToken);
        query += ` AND token != @exceptToken`;
      }
      await request.query(query);
    } catch {
      console.warn('MSSQL unavailable — user sessions revoked from cache only');
    }
  }
}
