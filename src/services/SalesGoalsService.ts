import { getPool } from '../config/database';
import { CacheService } from './CacheService';
import { ServiceUnavailableError } from '../utils/errors';
import sql from 'mssql';

export interface SalesGoal {
    id: number;
    year: number;
    month: number;
    goal_amount: number;
    created_at?: Date;
    updated_at?: Date;
}

export class SalesGoalsService {
    static async getAll(): Promise<SalesGoal[]> {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT id, year, month, goal_amount, created_at, updated_at
            FROM [desarrollo].[dbo].[sales_goals]
            ORDER BY year DESC, month DESC
        `);
        return result.recordset;
    }

    static async getById(id: number): Promise<SalesGoal | null> {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT id, year, month, goal_amount, created_at, updated_at
                FROM [desarrollo].[dbo].[sales_goals]
                WHERE id = @id
            `);
        return result.recordset[0] || null;
    }

    static async create(year: number, month: number, goalAmount: number): Promise<SalesGoal> {
        if (!CacheService.getMssqlAvailable()) {
            throw new ServiceUnavailableError();
        }
        const pool = await getPool();
        const result = await pool.request()
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .input('goal_amount', sql.Decimal(18, 2), goalAmount)
            .query(`
                INSERT INTO [desarrollo].[dbo].[sales_goals] (year, month, goal_amount)
                OUTPUT INSERTED.id, INSERTED.year, INSERTED.month, INSERTED.goal_amount, INSERTED.created_at, INSERTED.updated_at
                VALUES (@year, @month, @goal_amount)
            `);
        return result.recordset[0];
    }

    static async update(id: number, goalAmount: number): Promise<SalesGoal | null> {
        if (!CacheService.getMssqlAvailable()) {
            throw new ServiceUnavailableError();
        }
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('goal_amount', sql.Decimal(18, 2), goalAmount)
            .query(`
                UPDATE [desarrollo].[dbo].[sales_goals]
                SET goal_amount = @goal_amount, updated_at = GETDATE()
                OUTPUT INSERTED.id, INSERTED.year, INSERTED.month, INSERTED.goal_amount, INSERTED.created_at, INSERTED.updated_at
                WHERE id = @id
            `);
        return result.recordset[0] || null;
    }

    static async delete(id: number): Promise<boolean> {
        if (!CacheService.getMssqlAvailable()) {
            throw new ServiceUnavailableError();
        }
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM [desarrollo].[dbo].[sales_goals]
                WHERE id = @id
            `);
        return result.rowsAffected[0] > 0;
    }
}
