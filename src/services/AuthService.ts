import bcrypt from 'bcrypt';
import poolPromise from '../config/database';
import { signToken } from '../config/auth';
import { SessionsService } from './SessionsService';

const SALT_ROUNDS = 10;
const SESSION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_DAYS = 1;

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
    const pool = await poolPromise;
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
  }

  static async login(
    username: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    const pool = await poolPromise;
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

    // Check if force_password_reset is active
    if (user.force_password_reset) {
      const now = new Date();
      const expiresAt = user.password_reset_expires_at ? new Date(user.password_reset_expires_at) : null;

      if (expiresAt && expiresAt > now) {
        // Flag is active — capture whatever password they typed as the new password
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

        // Proceed to issue token
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
        // Flag expired or no expiry set — auto-clear it and fall through to normal password check
        const clearRequest = pool.request();
        clearRequest.input('userId', user.id);
        await clearRequest.query(`
          UPDATE Users SET force_password_reset = 0, password_reset_expires_at = NULL WHERE id = @userId
        `);
      }
    }

    // Normal password verification
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
  }

  static async getMe(userId: number) {
    const pool = await poolPromise;
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
  }

  static async checkResetStatus(username: string) {
    const pool = await poolPromise;
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
  }
}
