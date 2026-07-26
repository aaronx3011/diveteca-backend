import poolPromise from '../config/database';

export class SessionsService {
  static async createSession(userId: number, token: string, expiresAt: Date, ipAddress?: string, userAgent?: string) {
    const pool = await poolPromise;
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
  }

  static async isSessionValid(token: string): Promise<boolean> {
    const pool = await poolPromise;
    const request = pool.request();
    request.input('token', token);

    const result = await request.query(`
      SELECT id FROM Sessions
      WHERE token = @token
        AND is_revoked = 0
        AND expires_at > GETDATE()
    `);
    return result.recordset.length > 0;
  }

  static async revokeSession(token: string) {
    const pool = await poolPromise;
    const request = pool.request();
    request.input('token', token);

    await request.query(`
      UPDATE Sessions SET is_revoked = 1 WHERE token = @token
    `);
  }

  static async revokeAllUserSessions(userId: number, exceptToken?: string) {
    const pool = await poolPromise;
    const request = pool.request();
    request.input('userId', userId);

    let query = `UPDATE Sessions SET is_revoked = 1 WHERE user_id = @userId`;
    if (exceptToken) {
      request.input('exceptToken', exceptToken);
      query += ` AND token != @exceptToken`;
    }
    await request.query(query);
  }
}
