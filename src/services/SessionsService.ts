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
    } catch {
      console.warn('MSSQL unavailable — session written to cache only');
    }
  }

  static async isSessionValid(token: string): Promise<boolean> {
    const cacheSession = CacheService.getSession(token);
    if (cacheSession) {
      const now = Math.floor(Date.now() / 1000);
      if (cacheSession.expires_at > now && cacheSession.is_valid === 1) {
        return true;
      }
    }

    try {
      const pool = await getPool();
      const request = pool.request();
      request.input('token', token);

      const result = await request.query(`
        SELECT id FROM Sessions
        WHERE token = @token
          AND is_revoked = 0
          AND expires_at > GETDATE()
      `);
      return result.recordset.length > 0;
    } catch {
      return false;
    }
  }

  static async revokeSession(token: string) {
    CacheService.deleteSession(token);

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
