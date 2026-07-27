import { getPool } from '../config/database';
import { CacheService } from './CacheService';
import sql from 'mssql';

export interface IssueReport {
    id: number;
    title: string;
    description: string;
    reporter_name: string;
    reporter_email: string;
    severity: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}

export class IssueReportsService {
    static async getAll(): Promise<IssueReport[]> {
        const key = CacheService.buildCacheKey('IssueReportsService', 'getAll');
        return CacheService.cacheAside(key, async () => {
            const pool = await getPool();
            const result = await pool.request().query(`
                SELECT id, title, description, reporter_name, reporter_email, severity, status, created_at, updated_at
                FROM [desarrollo].[dbo].[issue_reports]
                ORDER BY created_at DESC
            `);
            return result.recordset;
        });
    }

    static async getById(id: number): Promise<IssueReport | null> {
        const key = CacheService.buildCacheKey('IssueReportsService', 'getById', id);
        return CacheService.cacheAside(key, async () => {
            const pool = await getPool();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT id, title, description, reporter_name, reporter_email, severity, status, created_at, updated_at
                    FROM [desarrollo].[dbo].[issue_reports]
                    WHERE id = @id
                `);
            return result.recordset[0] || null;
        });
    }

    static async create(title: string, description: string, reporterName: string, reporterEmail: string, severity: string): Promise<IssueReport> {
        const pool = await getPool();
        const result = await pool.request()
            .input('title', sql.VarChar(255), title)
            .input('description', sql.Text, description)
            .input('reporter_name', sql.VarChar(255), reporterName)
            .input('reporter_email', sql.VarChar(255), reporterEmail)
            .input('severity', sql.VarChar(20), severity)
            .query(`
                INSERT INTO [desarrollo].[dbo].[issue_reports] (title, description, reporter_name, reporter_email, severity)
                OUTPUT INSERTED.id, INSERTED.title, INSERTED.description, INSERTED.reporter_name, INSERTED.reporter_email, INSERTED.severity, INSERTED.status, INSERTED.created_at, INSERTED.updated_at
                VALUES (@title, @description, @reporter_name, @reporter_email, @severity)
            `);
        CacheService.del(CacheService.buildCacheKey('IssueReportsService', 'getAll'));
        return result.recordset[0];
    }

    static async updateStatus(id: number, status: string): Promise<IssueReport | null> {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.VarChar(50), status)
            .query(`
                UPDATE [desarrollo].[dbo].[issue_reports]
                SET status = @status, updated_at = GETDATE()
                OUTPUT INSERTED.id, INSERTED.title, INSERTED.description, INSERTED.reporter_name, INSERTED.reporter_email, INSERTED.severity, INSERTED.status, INSERTED.created_at, INSERTED.updated_at
                WHERE id = @id
            `);
        CacheService.del(CacheService.buildCacheKey('IssueReportsService', 'getAll'));
        CacheService.del(CacheService.buildCacheKey('IssueReportsService', 'getById', id));
        return result.recordset[0] || null;
    }

    static async delete(id: number): Promise<boolean> {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM [desarrollo].[dbo].[issue_reports]
                WHERE id = @id
            `);
        CacheService.del(CacheService.buildCacheKey('IssueReportsService', 'getAll'));
        CacheService.del(CacheService.buildCacheKey('IssueReportsService', 'getById', id));
        return result.rowsAffected[0] > 0;
    }
}
