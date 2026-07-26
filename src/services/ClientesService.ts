import { getPool } from '../config/database';
import { CacheService } from './CacheService';

export class ClientesService {
    static async getClientesList() {
        const key = CacheService.buildCacheKey('ClientesService', 'getClientesList');
        return CacheService.cacheAside(key, async () => {
            const pool = await getPool();
            const query = `
                SELECT co_cli as [Codigo_Cliente], cli_des as [Nombre_Cliente], tip_cli as [Tipo_Cliente]
                FROM [aaron_view_Clientes]
            `;
            const result = await pool.request().query(query);
            return result.recordset;
        });
    }
}
