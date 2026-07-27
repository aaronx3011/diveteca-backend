import bcrypt from 'bcrypt';
import { getPool } from '../config/database';
import { signToken } from '../config/auth';
import { ServiceUnavailableError } from '../utils/errors';
import { SessionsService } from './SessionsService';
import { HealthService } from './HealthService';
import { CacheService } from './CacheService';

const SALT_ROUNDS = 10;
const SESSION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_DAYS = 1;

function isConnectionError(err: any): boolean {
  return err?.code === 'ETIMEOUT' || err?.code === 'ECONNREFUSED' || err?.code === 'ESOCKET' || err?.message?.includes('Failed to connect') || err?.message === 'MSSQL is not available';
}

function handleDbError(err: any): never {
  if (isConnectionError(err)) {
    HealthService.setMssqlAvailable(false);
    throw new ServiceUnavailableError();
  }
  throw err;
}

export interface AuthResult {
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
  };
  token: string;
}

export class AuthService {
  static async register(
    username: string,
    email: string,
    password: string,
    fullName: string,
    role: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    try {
      const pool = await getPool();
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const request = pool.request();
      request.input('username', username);
      request.input('email', email);
      request.input('passwordHash', passwordHash);
      request.input('fullName', fullName);
      request.input('role', role);

      const result = await request.query(`
        INSERT INTO Users (username, email, password_hash, full_name, role)
        OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.full_name, INSERTED.role
        VALUES (@username, @email, @passwordHash, @fullName, @role)
      `);

      const user = result.recordset[0];

      CacheService.cacheUser({
        user_id: user.id,
        username: user.username,
        email: user.email,
        password_hash: passwordHash,
        full_name: user.full_name,
        role: user.role,
      });

      const token = signToken({ userId: user.id, role: user.role });
      const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
      await SessionsService.createSession(user.id, token, expiresAt, ipAddress, userAgent);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
        token,
      };
    } catch (err) {
      handleDbError(err);
    }
  }

  static async login(
    username: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    try {
      const pool = await getPool();
      const request = pool.request();
      request.input('username', username);

      const result = await request.query(`
        SELECT id, username, email, password_hash, full_name, role,
               force_password_reset, password_reset_expires_at
        FROM Users WHERE username = @username
      `);

      if (result.recordset.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.recordset[0];

      CacheService.cacheUser({
        user_id: user.id,
        username: user.username,
        email: user.email,
        password_hash: user.password_hash,
        full_name: user.full_name,
        role: user.role,
      });

      // Check if force_password_reset is active
      if (user.force_password_reset) {
        const now = new Date();
        const expiresAt = user.password_reset_expires_at ? new Date(user.password_reset_expires_at) : null;

        if (expiresAt && expiresAt > now) {
          const newHash = await bcrypt.hash(password, SALT_ROUNDS);

          const updateRequest = pool.request();
          updateRequest.input('newHash', newHash);
          updateRequest.input('userId', user.id);
          await updateRequest.query(`
            UPDATE Users
            SET password_hash = @newHash,
                force_password_reset = 0,
                password_reset_expires_at = NULL
            WHERE id = @userId
          `);

          const token = signToken({ userId: user.id, role: user.role });
          const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
          await SessionsService.createSession(user.id, token, sessionExpiresAt, ipAddress, userAgent);

          return {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              full_name: user.full_name,
              role: user.role,
            },
            token,
          };
        } else {
          const clearRequest = pool.request();
          clearRequest.input('userId', user.id);
          await clearRequest.query(`
            UPDATE Users SET force_password_reset = 0, password_reset_expires_at = NULL WHERE id = @userId
          `);
        }
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        throw new Error('Invalid credentials');
      }

      const token = signToken({ userId: user.id, role: user.role });
      const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
      await SessionsService.createSession(user.id, token, sessionExpiresAt, ipAddress, userAgent);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
        token,
      };
    } catch (err: any) {
      if (isConnectionError(err)) {
        HealthService.setMssqlAvailable(false);
        return AuthService.loginFromCache(username, password, ipAddress, userAgent);
      }
      throw err;
    }
  }

  private static async loginFromCache(
    username: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    const cached = CacheService.getCachedUser(username);
    if (!cached) {
      throw new ServiceUnavailableError('MSSQL is unavailable and user is not cached');
    }

    const passwordMatch = await bcrypt.compare(password, cached.password_hash);
    if (!passwordMatch) {
      throw new Error('Invalid credentials');
    }

    const token = signToken({ userId: cached.user_id, role: cached.role });
    const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
    await SessionsService.createSession(cached.user_id, token, sessionExpiresAt, ipAddress, userAgent);

    return {
      user: {
        id: cached.user_id,
        username: cached.username,
        email: cached.email,
        full_name: cached.full_name,
        role: cached.role,
      },
      token,
    };
  }

  static async getMe(userId: number) {
    try {
      const pool = await getPool();
      const request = pool.request();
      request.input('userId', userId);

      const result = await request.query(`
        SELECT id, username, email, full_name, role, created_at
        FROM Users WHERE id = @userId
      `);

      if (result.recordset.length === 0) {
        throw new Error('User not found');
      }

      return result.recordset[0];
    } catch (err: any) {
      if (isConnectionError(err)) {
        const cached = CacheService.getCachedUserById(userId);
        if (cached) {
          return {
            id: cached.user_id,
            username: cached.username,
            email: cached.email,
            full_name: cached.full_name,
            role: cached.role,
            created_at: null,
          };
        }
      }
      handleDbError(err);
    }
  }

  static async checkResetStatus(username: string) {
    try {
      const pool = await getPool();
      const request = pool.request();
      request.input('username', username);

      const result = await request.query(`
        SELECT force_password_reset, password_reset_expires_at
        FROM Users WHERE username = @username
      `);

      if (result.recordset.length === 0) {
        return { forceReset: false };
      }

      const user = result.recordset[0];
      if (!user.force_password_reset) {
        return { forceReset: false };
      }

      const now = new Date();
      const expiresAt = user.password_reset_expires_at ? new Date(user.password_reset_expires_at) : null;

      if (expiresAt && expiresAt > now) {
        return { forceReset: true, expiresAt: expiresAt.toISOString() };
      }

      return { forceReset: false };
    } catch (err) {
      handleDbError(err);
    }
  }
}
