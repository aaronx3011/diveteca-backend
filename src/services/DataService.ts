import { getPool } from '../config/database';
import { CacheService } from './CacheService';
import { ALLOWED_VIEWS } from '../constants/views';

export class DataService {
    static async getDashboardData(viewName: string, limit: number, offset: number) {
        if (!ALLOWED_VIEWS.includes(viewName)) {
            throw new Error('Invalid view name');
        }
        const key = CacheService.buildCacheKey('DataService', 'getDashboardData', viewName, limit, offset);
        return CacheService.cacheAside(key, async () => {
            const pool = await getPool();
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
        });
    }
}
