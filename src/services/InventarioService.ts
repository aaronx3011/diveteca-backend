import { getPool } from '../config/database';
import { CacheService } from './CacheService';
import sql from 'mssql';
import { InventoryReportService } from './InventoryReportService';
import type { ReplenishmentFilter } from '../types/inventory';

export class InventarioService {
    static async getInventarioTotal() {
        const key = CacheService.buildCacheKey('InventarioService', 'getInventarioTotal');
        const data = await CacheService.cacheAside(key, async () => {
            const result = await (await getPool()).request().query('SELECT * FROM [aaron_view_TotalInventarioDolarizado]');
            return result.recordset;
        });
        return {
            metadata: { source: 'target-inventory-view' as const, generatedAt: new Date().toISOString(), rowLimit: data.length, possiblyTruncated: false, count: data.length },
            data,
        };
    }

    static async getLotesByProducto(codigoArticulo: string) {
        const key = CacheService.buildCacheKey('InventarioService', 'getLotesByProducto', codigoArticulo);
        const data = await CacheService.cacheAside(key, async () => {
            const request = (await getPool()).request();
            request.input('codigoArticulo', codigoArticulo);
            const result = await request.query(`
                SELECT * FROM [aaron_view_DetalleInventarioAlmacenLoteVencimientoDolarizado]
                WHERE Codigo_Articulo = @codigoArticulo
                ORDER BY Fecha_Vencimiento ASC
            `);
            return result.recordset;
        });
        return {
            metadata: { source: 'target-inventory-view' as const, generatedAt: new Date().toISOString(), rowLimit: data.length, possiblyTruncated: false, count: data.length },
            data,
        };
    }

    static getInventoryReport() { return InventoryReportService.getReport(); }
    static getCompleteInventoryReport() { return InventoryReportService.getCompleteReport(); }
    static async getInventoryByProduct() { const report = await InventoryReportService.getReport(); return { metadata: report.metadata, data: InventoryReportService.aggregateByProduct(report.data) }; }
    static async getInventoryByExpiry() { const report = await InventoryReportService.getReport(); return { metadata: report.metadata, data: InventoryReportService.aggregateByExpiry(report.data) }; }
    static getReplenishment(filter: ReplenishmentFilter) { return InventoryReportService.getReplenishment(filter); }

    static async getAlmacenesList() {
        const key = CacheService.buildCacheKey('InventarioService', 'getAlmacenesList');
        return CacheService.cacheAside(key, async () => {
            const pool = await getPool();
            const query = `
                SELECT DISTINCT co_alma AS Codigo_Almacen, des_alma AS Nombre_Almacen
                FROM [A_DIVETE_A].[dbo].[saAlmacen]
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
