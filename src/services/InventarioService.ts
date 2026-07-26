import poolPromise from '../config/database';
import sql from 'mssql';

export class InventarioService {
    static async getInventarioTotal() {
        const pool = await poolPromise;
        const query = `
        SELECT * FROM [aaron_view_TotalInventarioDolarizado]
        `;
        const result = await pool.request().query(query);
        return result.recordset;
    }

    static async getLotesByProducto(codigoArticulo: string) {
        const pool = await poolPromise;
        const query = `
            SELECT * FROM [aaron_view_DetalleInventarioAlmacenLoteVencimientoDolarizado]
            WHERE Codigo_Articulo = @codigoArticulo
            ORDER BY Fecha_Vencimiento ASC
        `;
        const request = pool.request();
        request.input('codigoArticulo', codigoArticulo);
        const result = await request.query(query);
        return result.recordset;
    }

    static async getAlmacenesList() {
        const pool = await poolPromise;
        const query = `
            SELECT DISTINCT co_alma AS Codigo_Almacen, des_alma AS Nombre_Almacen
            FROM [A_MEDVAL_A].[dbo].[saAlmacen]
            ORDER BY Nombre_Almacen
        `;
        const result = await pool.request().query(query);
        return result.recordset;
    }

    static async getAlmacenesExcluidos() {
        const pool = await poolPromise;
        const query = `
            SELECT Codigo_Almacen
            FROM [aaron_AlmacenesExcluidos]
            ORDER BY Codigo_Almacen
        `;
        const result = await pool.request().query(query);
        return result.recordset;
    }

    static async addAlmacenExcluido(codigoAlmacen: string) {
        const pool = await poolPromise;
        const query = `
            INSERT INTO [aaron_AlmacenesExcluidos] (Codigo_Almacen)
            VALUES (@codigoAlmacen)
        `;
        const request = pool.request();
        request.input('codigoAlmacen', sql.NVarChar(50), codigoAlmacen);
        await request.query(query);
    }

    static async removeAlmacenExcluido(codigoAlmacen: string) {
        const pool = await poolPromise;
        const query = `
            DELETE FROM [aaron_AlmacenesExcluidos]
            WHERE Codigo_Almacen = @codigoAlmacen
        `;
        const request = pool.request();
        request.input('codigoAlmacen', sql.NVarChar(50), codigoAlmacen);
        await request.query(query);
    }
}