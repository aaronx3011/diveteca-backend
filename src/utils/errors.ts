import { Response } from 'express';

export class ServiceUnavailableError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message?: string) {
    super(message || 'Database is currently unavailable. Write operations are disabled.');
    this.name = 'ServiceUnavailableError';
    this.statusCode = 503;
    this.code = 'service_unavailable';
  }
}

export function sendControllerError(res: Response, error: unknown): void {
  if (error instanceof ServiceUnavailableError) {
    res.status(503).json({ error: 'service_unavailable', message: error.message });
    return;
  }
  res.status(500).json({ error: 'Internal Server Error' });
}
