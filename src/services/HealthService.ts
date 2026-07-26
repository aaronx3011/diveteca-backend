import { getCacheDb } from '../config/cache';

export class HealthService {
  static getMssqlAvailable(): boolean {
    const db = getCacheDb();
    const row = db.prepare("SELECT value FROM cache_metadata WHERE key = 'mssql_available'").get() as { value: string } | undefined;
    return row?.value === 'true';
  }

  static setMssqlAvailable(available: boolean): void {
    const db = getCacheDb();
    db.prepare(`
      INSERT INTO cache_metadata (key, value) VALUES ('mssql_available', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(available ? 'true' : 'false');
  }

  static getMssqlFailureCount(): number {
    const db = getCacheDb();
    const row = db.prepare("SELECT value FROM cache_metadata WHERE key = 'mssql_failure_count'").get() as { value: string } | undefined;
    return row ? parseInt(row.value, 10) : 0;
  }

  static incrementMssqlFailureCount(): void {
    const db = getCacheDb();
    const count = this.getMssqlFailureCount() + 1;
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      INSERT INTO cache_metadata (key, value) VALUES ('mssql_last_failure_at', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(now.toString());
    db.prepare(`
      INSERT INTO cache_metadata (key, value) VALUES ('mssql_failure_count', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(count.toString());
  }

  static resetMssqlFailureCount(): void {
    const db = getCacheDb();
    db.prepare(`
      INSERT INTO cache_metadata (key, value) VALUES ('mssql_failure_count', '0')
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run();
  }

  static shouldRetryMssql(): boolean {
    const db = getCacheDb();
    const count = this.getMssqlFailureCount();
    if (count === 0) return true;

    const row = db.prepare("SELECT value FROM cache_metadata WHERE key = 'mssql_last_failure_at'").get() as { value: string } | undefined;
    if (!row) return true;

    const lastFailure = parseInt(row.value, 10);
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - lastFailure;

    const backoff = Math.min(Math.pow(2, count), 300);
    return elapsed >= backoff;
  }
}
