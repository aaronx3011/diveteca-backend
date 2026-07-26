export class ServiceUnavailableError extends Error {
  constructor(message?: string) {
    super(message || 'Database is currently unavailable. Write operations are disabled.');
    this.name = 'ServiceUnavailableError';
  }
}
