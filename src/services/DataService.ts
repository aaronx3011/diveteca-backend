import poolPromise from '../config/database';

export class DataService {
    static async getDashboardData(viewName: string, limit: number, offset: number) {
        const pool = await poolPromise;
        
        // Ensure ordering for OFFSET to work in SQL Server (Using a generic sort logic)
        const query = `
            SELECT * FROM [${viewName}]
            ORDER BY (SELECT NULL)
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        const request = pool.request();
        request.input('offset', offset);
        request.input('limit', limit);

        const result = await request.query(query);
        return result.recordset;
    }
}