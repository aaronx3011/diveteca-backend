import { getPool } from '../config/database';
import { CacheService } from './CacheService';
import { ServiceUnavailableError } from '../utils/errors';
import sql from 'mssql';

export class InventarioService {
    static async getInventarioTotal() {
        const key = CacheService.buildCacheKey('InventarioService', 'getInventarioTotal');
        return CacheService.cacheAside(key, async () => {
            const pool = await getPool();
            const query = `SELECT * FROM [aaron_view_TotalInventarioDolarizado]`;
            const result = await pool.request().query(query);
            return result.recordset;
        });
    }

    static async getLotesByProducto(codigoArticulo: string) {
        const key = CacheService.buildCacheKey('InventarioService', 'getLotesByProducto', codigoArticulo);
        return CacheService.cacheAside(key, async () => {
            const pool = await getPool();
            const query = `
                SELECT * FROM [aaron_view_DetalleInventarioAlmacenLoteVencimientoDolarizado]
                WHERE Codigo_Articulo = @codigoArticulo
                ORDER BY Fecha_Vencimiento ASC
            `;
            const request = pool.request();
            request.input('codigoArticulo', codigoArticulo);
            const result = await request.query(query);
            return result.recordset;
        });
    }

    static async getAlmacenesList() {
        const key = CacheService.buildCacheKey('InventarioService', 'getAlmacenesList');
        return CacheService.cacheAside(key, async () => {
            const pool = await getPool();
            const query = `
                SELECT DISTINCT co_alma AS Codigo_Almacen, des_alma AS Nombre_Almacen
                FROM [A_MEDVAL_A].[dbo].[saAlmacen]
                ORDER BY Nombre_Almacen
            `;
            const result = await pool.request().query(query);
            return result.recordset;
        });
    }

    static async getAlmacenesExcluidos() {
        const key = CacheService.buildCacheKey('InventarioService', 'getAlmacenesExcluidos');
        return CacheService.cacheAside(key, async () => {
            const pool = await getPool();
            const query = `
                SELECT Codigo_Almacen
                FROM [aaron_AlmacenesExcluidos]
                ORDER BY Codigo_Almacen
            `;
            const result = await pool.request().query(query);
            return result.recordset;
        });
    }

    static async addAlmacenExcluido(codigoAlmacen: string) {
        if (!CacheService.getMssqlAvailable()) {
            throw new ServiceUnavailableError();
        }
        const pool = await getPool();
        const query = `
            INSERT INTO [aaron_AlmacenesExcluidos] (Codigo_Almacen)
            VALUES (@codigoAlmacen)
        `;
        const request = pool.request();
        request.input('codigoAlmacen', sql.NVarChar(50), codigoAlmacen);
        await request.query(query);
        CacheService.del(CacheService.buildCacheKey('InventarioService', 'getAlmacenesExcluidos'));
    }

    static async removeAlmacenExcluido(codigoAlmacen: string) {
        if (!CacheService.getMssqlAvailable()) {
            throw new ServiceUnavailableError();
        }
        const pool = await getPool();
        const query = `
            DELETE FROM [aaron_AlmacenesExcluidos]
            WHERE Codigo_Almacen = @codigoAlmacen
        `;
        const request = pool.request();
        request.input('codigoAlmacen', sql.NVarChar(50), codigoAlmacen);
        await request.query(query);
        CacheService.del(CacheService.buildCacheKey('InventarioService', 'getAlmacenesExcluidos'));
    }
}
