import poolPromise from '../config/database';

export class UserService {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT id, username, email, full_name, role, created_at
      FROM Users
      ORDER BY created_at DESC
    `);
    return result.recordset;
  }
}
