import { Request, Response } from 'express';
import { HealthService } from '../services/HealthService';
import { isMssqlConnected } from '../config/database';

export class HealthController {
  static status(req: Request, res: Response) {
    try {
      const mssqlAvailable = HealthService.getMssqlAvailable();
      const mssqlConnected = isMssqlConnected();

      res.status(200).json({
        status: mssqlConnected ? 'connected' : 'degraded',
        mssql: {
          available: mssqlAvailable,
          connected: mssqlConnected,
          failureCount: HealthService.getMssqlFailureCount(),
        },
        sqlite: { available: true },
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
