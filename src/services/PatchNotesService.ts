import poolPromise from '../config/database';
import sql from 'mssql';

export interface PatchNote {
    id: number;
    title: string;
    content: string;
    version: string;
    category: string;
    published_at: Date;
    created_at: Date;
}

export class PatchNotesService {
    static async getAll(): Promise<PatchNote[]> {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT id, title, content, version, category, published_at, created_at
            FROM [desarrollo].[dbo].[patch_notes]
            ORDER BY published_at DESC
        `);
        return result.recordset;
    }

    static async getById(id: number): Promise<PatchNote | null> {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT id, title, content, version, category, published_at, created_at
                FROM [desarrollo].[dbo].[patch_notes]
                WHERE id = @id
            `);
        return result.recordset[0] || null;
    }

    static async create(title: string, content: string, version: string, category: string): Promise<PatchNote> {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('title', sql.VarChar(255), title)
            .input('content', sql.Text, content)
            .input('version', sql.VarChar(50), version)
            .input('category', sql.VarChar(50), category)
            .query(`
                INSERT INTO [desarrollo].[dbo].[patch_notes] (title, content, version, category)
                OUTPUT INSERTED.id, INSERTED.title, INSERTED.content, INSERTED.version, INSERTED.category, INSERTED.published_at, INSERTED.created_at
                VALUES (@title, @content, @version, @category)
            `);
        return result.recordset[0];
    }
}
