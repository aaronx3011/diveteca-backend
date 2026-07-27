import { Request, Response } from 'express';
import { getCacheDb } from '../config/cache';
import { HealthService } from '../services/HealthService';
import { isMssqlConnected } from '../config/database';

export class HealthController {
  static status(req: Request, res: Response) {
    try {
      const db = getCacheDb();

      const cacheEntryCount = (db.prepare('SELECT COUNT(*) as count FROM cache_entries').get() as any)?.count ?? 0;
      const sessionCount = (db.prepare('SELECT COUNT(*) as count FROM sessions').get() as any)?.count ?? 0;
      const cachedUserCount = (db.prepare('SELECT COUNT(*) as count FROM cached_users').get() as any)?.count ?? 0;

      const mssqlAvailable = HealthService.getMssqlAvailable();
      const mssqlConnected = isMssqlConnected();
      const failureCount = HealthService.getMssqlFailureCount();

      res.status(200).json({
        status: mssqlConnected ? 'connected' : 'degraded',
        mssql: {
          available: mssqlAvailable,
          connected: mssqlConnected,
          failureCount,
          server: process.env.DB_SERVER || 'unknown',
        },
        sqlite: {
          available: true,
          cacheEntries: cacheEntryCount,
          sessions: sessionCount,
          cachedUsers: cachedUserCount,
        },
      });
    } catch {
      res.status(200).json({
        status: 'error',
        mssql: { available: false, connected: false, failureCount: -1 },
        sqlite: { available: false },
      });
    }
  }
}
