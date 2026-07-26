import { getPool } from '../config/database';
import { CacheService } from './CacheService';

export class UserService {
  static async getAll() {
    const key = CacheService.buildCacheKey('UserService', 'getAll');
    return CacheService.cacheAside(key, async () => {
      const pool = await getPool();
      const result = await pool.request().query(`
        SELECT id, username, email, full_name, role, created_at
        FROM Users
        ORDER BY created_at DESC
      `);
      return result.recordset;
    });
  }
}
