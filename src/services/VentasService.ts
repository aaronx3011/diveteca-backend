import poolPromise from '../config/database';

export class VentasService {
    static async getVentasAnual(
        year: string | null = null
    ) {

        const pool = await poolPromise;
        
        // Ensure ordering for OFFSET to work in SQL Server (Using a generic sort logic)
        let query = `
            SELECT * FROM [aaron_view_VentasDolarizadasAnual]
        `;

        console.log('year:', year);
        if (year) {
            query += ` WHERE [Anio] = ${year}`;
        }
        query += ` ORDER BY [Anio]`;

        const request = pool.request();
        const result = await request.query(query);
        return result.recordset;
    }

    static async getVentasMensual(
        year: string | null = null
    ) {
        const pool = await poolPromise;

        let query = `
            SELECT * FROM [aaron_view_VentasDolarizadasMensual]
        `;

        console.log('year:', year);
        if (year) {
            query += ` WHERE [Anio] = ${year}`;
            query += ` ORDER BY [Mes]`;
        }
        else {
            query += ` ORDER BY [Anio] DESC, [Mes] DESC`;
        }

        const request = pool.request();
        const result = await request.query(query);
        return result.recordset;
    }
    static async getVentasMensualPorProducto(
        producto: string
    ) {
        const pool = await poolPromise;

        let query = `
            SELECT * FROM [aaron_view_DetalleVentasDolarizadasProductoMensual]
        `;

        console.log('producto:', producto);
        if (producto) {
            query += ` WHERE [Codigo_Articulo] = '${producto}'`;
            query += ` ORDER BY [Anio] DESC, [Mes] DESC`;
        }
        else {
            // If no product is specified, we can either return an error
            throw new Error("Product parameter is required.");
        }

        const request = pool.request();
        const result = await request.query(query);
        return result.recordset;
    }




    static async getVentasAgrupadoMensualPorProducto(
        startYear: string,
        startMonth: string,
        endYear: string,
        endMonth: string
    ) {
        const pool = await poolPromise;

        const startYearInt = Number.parseInt(startYear, 10);
        const startMonthInt = Number.parseInt(startMonth, 10);
        const endYearInt = Number.parseInt(endYear, 10);
        const endMonthInt = Number.parseInt(endMonth, 10);

        if (
            Number.isNaN(startYearInt) ||
            Number.isNaN(startMonthInt) ||
            Number.isNaN(endYearInt) ||
            Number.isNaN(endMonthInt)
        ) {
            throw new Error('Invalid date range parameters.');
        }

        const startPeriod = startYearInt * 100 + startMonthInt;
        const endPeriod = endYearInt * 100 + endMonthInt;

        if (endPeriod < startPeriod) {
            throw new Error('End date must be the same or later than start date.');
        }

        const query = `
            SELECT
                [Codigo_Articulo],
                [Ref_Articulo],
                [Descripcion_Articulo],
                SUM([Total_USD]) AS [Total_USD],
                SUM([Total_Facturas]) AS [Total_Facturas],
                SUM([Total_Unidades]) AS [Total_Unidades]
            FROM [aaron_view_DetalleVentasDolarizadasProductoMensual]
            WHERE ([Anio] * 100 + [Mes]) BETWEEN ${startPeriod} AND ${endPeriod}
            GROUP BY [Codigo_Articulo], [Ref_Articulo], [Descripcion_Articulo]
            ORDER BY [Total_USD] DESC
        `;

        const request = pool.request();
        const result = await request.query(query);
        return result.recordset;
    }



    // from detalle ventas dolarizadas mensual get the years and months available for the dropdowns in the frontend
    static async getVentasFechasDisponibles() {
        const pool = await poolPromise;

        const query = `
            SELECT DISTINCT [Anio], [Mes]
            FROM [aaron_view_DetalleVentasDolarizadasProductoMensual]
            ORDER BY [Anio] DESC, [Mes] DESC
        `;

        const request = pool.request();
        const result = await request.query(query);
        return result.recordset;
    }

    static async getVentasDetalleProductoMensualFechas(
        producto: string,
        startYear: string,
        startMonth: string,
        endYear: string,
        endMonth: string
    ) {
        const pool = await poolPromise;

        const startYearInt = Number.parseInt(startYear, 10);
        const startMonthInt = Number.parseInt(startMonth, 10);
        const endYearInt = Number.parseInt(endYear, 10);
        const endMonthInt = Number.parseInt(endMonth, 10);

        if (
            Number.isNaN(startYearInt) ||
            Number.isNaN(startMonthInt) ||
            Number.isNaN(endYearInt) ||
            Number.isNaN(endMonthInt)
        ) {
            throw new Error('Invalid date range parameters.');
        }

        const startPeriod = startYearInt * 100 + startMonthInt;
        const endPeriod = endYearInt * 100 + endMonthInt;

        if (endPeriod < startPeriod) {
            throw new Error('End date must be the same or later than start date.');
        }

        const query = `
            SELECT *
            FROM [aaron_view_DetalleVentasDolarizadasProductoMensual]
            WHERE [Codigo_Articulo] = '${producto}'
                AND ([Anio] * 100 + [Mes]) BETWEEN ${startPeriod} AND ${endPeriod}
            ORDER BY [Anio] DESC, [Mes] DESC
        `;

        const request = pool.request();
        const result = await request.query(query);
        return result.recordset;
    }
static async getVentasTopClientesActual() {
        const pool = await poolPromise;

// check for a solution for the error : Error fetching top clients data: RequestError: Column 'aaron_view_DetalleVentasDolarizadasClienteMensual.Nombre_Cliente' is invalid in the select list because it is not contained in either an aggregate function or the GROUP BY clause.

        const query = `
            SELECT TOP 10
                [Codigo_Cliente], [Nombre_Cliente],
                SUM([Total_USD]) AS [Total_USD]
            FROM [aaron_view_DetalleVentasDolarizadasClienteMensual]
            WHERE ([Anio] * 100 + [Mes]) = (
                SELECT MAX([Anio] * 100 + [Mes]) FROM [aaron_view_DetalleVentasDolarizadasClienteMensual]
            )
            GROUP BY [Codigo_Cliente], [Nombre_Cliente]
            ORDER BY [Total_USD] DESC
        `;

        const request = pool.request();
        const result = await request.query(query);
        return result.recordset;
    }

    static async getVentasClientesPorProducto(
        producto: string
    ) {
        const pool = await poolPromise;
        const query = `
            SELECT *
            FROM [aaron_view_DetalleVentasDolarizadasProductoCliente]
            WHERE [Codigo_Articulo] = '${producto}'
            ORDER BY [Total_USD] DESC
        `;

        const request = pool.request();
        const result = await request.query(query);
        return result.recordset;
    }
    static async getVentasDetallePorCliente(
        cliente: string
    ) {
        const pool = await poolPromise;
        const query = `
            SELECT *
            FROM [aaron_view_DetalleVentasDolarizadasClienteMensual]
            WHERE [Codigo_Cliente] = '${cliente}'
            ORDER BY [Anio] DESC, [Mes] DESC
        `;

        const request = pool.request();
        const result = await request.query(query);
        return result.recordset;
    }
    static async getVentasAgrupadoPorClienteAnual() {
        const pool = await poolPromise;
        const query = `
            SELECT
                [Codigo_Cliente], [Nombre_Cliente],
                SUM([Total_USD]) AS [Total_USD]
            FROM [aaron_view_DetalleVentasDolarizadasClienteAnual]
            GROUP BY [Codigo_Cliente], [Nombre_Cliente]
        `;

        const request = pool.request();
        const result = await request.query(query);
        return result.recordset;
    }
    static async getVentasAgrupadoAnualPorMesPorProducto(){
        const pool = await poolPromise;
        const query = `
            SELECT 
                Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, Anio,
                SUM(CASE WHEN Mes = 1 THEN Total_USD ELSE 0 END) AS Enero,
                SUM(CASE WHEN Mes = 2 THEN Total_USD ELSE 0 END) AS Febrero,
                SUM(CASE WHEN Mes = 3 THEN Total_USD ELSE 0 END) AS Marzo,
                SUM(CASE WHEN Mes = 4 THEN Total_USD ELSE 0 END) AS Abril,
                SUM(CASE WHEN Mes = 5 THEN Total_USD ELSE 0 END) AS Mayo,
                SUM(CASE WHEN Mes = 6 THEN Total_USD ELSE 0 END) AS Junio,
                SUM(CASE WHEN Mes = 7 THEN Total_USD ELSE 0 END) AS Julio,
                SUM(CASE WHEN Mes = 8 THEN Total_USD ELSE 0 END) AS Agosto,
                SUM(CASE WHEN Mes = 9 THEN Total_USD ELSE 0 END) AS Septiembre,
                SUM(CASE WHEN Mes = 10 THEN Total_USD ELSE 0 END) AS Octubre,
                SUM(CASE WHEN Mes = 11 THEN Total_USD ELSE 0 END) AS Noviembre,
                SUM(CASE WHEN Mes = 12 THEN Total_USD ELSE 0 END) AS Diciembre,
                SUM(CASE WHEN Mes = 1 THEN Total_Unidades ELSE 0 END) AS Enero_Unidades,
                SUM(CASE WHEN Mes = 2 THEN Total_Unidades ELSE 0 END) AS Febrero_Unidades,
                SUM(CASE WHEN Mes = 3 THEN Total_Unidades ELSE 0 END) AS Marzo_Unidades,
                SUM(CASE WHEN Mes = 4 THEN Total_Unidades ELSE 0 END) AS Abril_Unidades,
                SUM(CASE WHEN Mes = 5 THEN Total_Unidades ELSE 0 END) AS Mayo_Unidades,
                SUM(CASE WHEN Mes = 6 THEN Total_Unidades ELSE 0 END) AS Junio_Unidades,
                SUM(CASE WHEN Mes = 7 THEN Total_Unidades ELSE 0 END) AS Julio_Unidades,
                SUM(CASE WHEN Mes = 8 THEN Total_Unidades ELSE 0 END) AS Agosto_Unidades,
                SUM(CASE WHEN Mes = 9 THEN Total_Unidades ELSE 0 END) AS Septiembre_Unidades,
                SUM(CASE WHEN Mes = 10 THEN Total_Unidades ELSE 0 END) AS Octubre_Unidades,
                SUM(CASE WHEN Mes = 11 THEN Total_Unidades ELSE 0 END) AS Noviembre_Unidades,
                SUM(CASE WHEN Mes = 12 THEN Total_Unidades ELSE 0 END) AS Diciembre_Unidades
            FROM [aaron_view_DetalleVentasDolarizadasProductoMensual]
            GROUP BY Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, Anio
            ORDER BY Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, Anio
        `;

        const request = pool.request();
        const result = await request.query(query);
        return result.recordset;
    }



    static async getVentasProductoPorCliente(cliente: string) {
        const pool = await poolPromise;
        const query = `
            SELECT *
            FROM [aaron_view_DetalleVentasDolarizadasProductoCliente]
            WHERE [Codigo_Cliente] = '${cliente}'
            ORDER BY [Total_USD] DESC
        `;

        const request = pool.request();
        const result = await request.query(query);
        return result.recordset;
    }
    static async getVentasDetallePorMesPorAnio(
        year: string,
        month: string
    ) {
        console.log('Fetching sales details for year:', year, 'month:', month);
        const pool = await poolPromise;
        const query = `
            SELECT *
            FROM [aaron_view_DetalleVentasDolarizadas]  
            where Fecha_Emision >= DATEFROMPARTS(${year}, ${month}, 1)
                AND Fecha_Emision < DATEADD(MONTH, 1, DATEFROMPARTS(${year}, ${month}, 1))
            ORDER BY Fecha_Emision DESC
        `;

        const request = pool.request();
        const result = await request.query(query);
        return result.recordset;
    }
}