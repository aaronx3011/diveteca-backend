import { Request, Response } from 'express';
import { HealthService } from '../services/HealthService';
import { isMssqlConnected } from '../config/database';
import { getCacheHealth } from '../config/cache';
import { MssqlProbe } from '../services/MssqlProbe';

export class HealthController {
  static async status(req: Request, res: Response) {
    try {
      const probe = await MssqlProbe.check();
      const mssqlConnected = isMssqlConnected();
      const mssqlAvailable = HealthService.getMssqlAvailable();
      const sqlite = getCacheHealth();

      res.status(200).json({
        status: mssqlConnected && probe.ok ? 'connected' : 'degraded',
        mssql: {
          available: mssqlAvailable,
          connected: mssqlConnected,
          failureCount: HealthService.getMssqlFailureCount(),
          server: process.env.DB_SERVER ?? 'unknown',
          lastVerifiedAt: probe.checkedAt,
          lastProbe: {
            ok: probe.ok,
            latencyMs: probe.latencyMs,
            error: probe.error,
          },
        },
        sqlite,
      });
    } catch (err) {
      console.error('🔴 Health check failed:', err instanceof Error ? err.message : err);
      res.status(200).json({
        status: 'error',
        mssql: {
          available: false,
          connected: false,
          failureCount: -1,
          server: process.env.DB_SERVER ?? 'unknown',
          lastVerifiedAt: null,
          lastProbe: null,
        },
        sqlite: { available: false, cacheEntries: 0, sessions: 0, cachedUsers: 0 },
      });
    }
  }
}
