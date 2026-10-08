import { getPool } from '../config/database';
import { CacheService } from './CacheService';
import { DateRange } from '../types/ventas';

const SALES_SOURCE = 'dbo.Vw_NotasEntregaVentas';
const ACTIVE_SALES = `FROM ${SALES_SOURCE} WHERE Anulado = 0`;

export class VentasService {
    static async getVentasAnual(year: string | null = null) {
        const key = CacheService.buildCacheKey('VentasService', 'getVentasAnual', year);
        return CacheService.cacheAside(key, async () => {
            const query = `SELECT YEAR(Fecha) AS Anio, SUM(Cantidad) AS Total_Unidades, CAST(0 AS decimal(18, 2)) AS Total_VES, SUM(Neto_Renglon_USD) AS Total_USD, COUNT(DISTINCT Num_Nota) AS Total_Facturas ${ACTIVE_SALES}${year ? ' AND YEAR(Fecha) = @year' : ''} GROUP BY YEAR(Fecha) ORDER BY Anio`;
            const request = (await getPool()).request();
            if (year) request.input('year', year);
            return (await request.query(query)).recordset;
        });
    }

    static async getVentasMensual(year: string | null = null) {
        const key = CacheService.buildCacheKey('VentasService', 'getVentasMensual', year);
        return CacheService.cacheAside(key, async () => {
            const query = `SELECT YEAR(Fecha) AS Anio, MONTH(Fecha) AS Mes, SUM(Cantidad) AS Total_Unidades, CAST(0 AS decimal(18, 2)) AS Total_VES, SUM(Neto_Renglon_USD) AS Total_USD, COUNT(DISTINCT Num_Nota) AS Total_Facturas ${ACTIVE_SALES}${year ? ' AND YEAR(Fecha) = @year' : ''} GROUP BY YEAR(Fecha), MONTH(Fecha) ORDER BY Anio ${year ? '' : 'DESC'}, Mes ${year ? '' : 'DESC'}`;
            const request = (await getPool()).request();
            if (year) request.input('year', year);
            return (await request.query(query)).recordset;
        });
    }

    static async getVentasPorProducto() {
        return CacheService.cacheAside(CacheService.buildCacheKey('VentasService', 'getVentasPorProducto'), async () => (await (await getPool()).request().query(`SELECT Codigo_Articulo, MAX(Ref_Articulo) AS Ref_Articulo, MAX(Descripcion_Articulo) AS Descripcion_Articulo, SUM(Cantidad) AS Total_Unidades, CAST(0 AS decimal(18, 2)) AS Total_VES, SUM(Neto_Renglon_USD) AS Total_USD, COUNT(DISTINCT Num_Nota) AS Total_Facturas ${ACTIVE_SALES} GROUP BY Codigo_Articulo ORDER BY Total_USD DESC`)).recordset);
    }

    static async getVentasMensualPorProducto(producto: string) {
        if (!producto) throw new Error('Product parameter is required.');
        const key = CacheService.buildCacheKey('VentasService', 'getVentasMensualPorProducto', producto);
        return CacheService.cacheAside(key, async () => (await (await getPool()).request().input('producto', producto).query(`SELECT Codigo_Articulo, MAX(Ref_Articulo) AS Ref_Articulo, MAX(Descripcion_Articulo) AS Descripcion_Articulo, YEAR(Fecha) AS Anio, MONTH(Fecha) AS Mes, SUM(Cantidad) AS Total_Unidades, CAST(0 AS decimal(18, 2)) AS Total_VES, SUM(Neto_Renglon_USD) AS Total_USD, COUNT(DISTINCT Num_Nota) AS Total_Facturas ${ACTIVE_SALES} AND Codigo_Articulo = @producto GROUP BY Codigo_Articulo, YEAR(Fecha), MONTH(Fecha) ORDER BY Anio DESC, Mes DESC`)).recordset);
    }

    static async getVentasAgrupadoMensualPorProducto(dateRange: DateRange) {
        const key = CacheService.buildCacheKey('VentasService', 'getVentasAgrupadoMensualPorProducto', dateRange.startYear, dateRange.startMonth, dateRange.endYear, dateRange.endMonth);
        return CacheService.cacheAside(key, async () => {
            const startPeriod = dateRange.startYear * 100 + dateRange.startMonth, endPeriod = dateRange.endYear * 100 + dateRange.endMonth;
            if (endPeriod < startPeriod) throw new Error('End date must be the same or later than start date.');
            return (await (await getPool()).request().input('startPeriod', startPeriod).input('endPeriod', endPeriod).query(`SELECT Codigo_Articulo, MAX(Ref_Articulo) AS Ref_Articulo, MAX(Descripcion_Articulo) AS Descripcion_Articulo, SUM(Neto_Renglon_USD) AS Total_USD, COUNT(DISTINCT Num_Nota) AS Total_Facturas, SUM(Cantidad) AS Total_Unidades ${ACTIVE_SALES} AND (YEAR(Fecha) * 100 + MONTH(Fecha)) BETWEEN @startPeriod AND @endPeriod GROUP BY Codigo_Articulo ORDER BY Total_USD DESC`)).recordset;
        });
    }

    static async getVentasFechasDisponibles() {
        return CacheService.cacheAside(CacheService.buildCacheKey('VentasService', 'getVentasFechasDisponibles'), async () => (await (await getPool()).request().query(`SELECT DISTINCT YEAR(Fecha) AS Anio, MONTH(Fecha) AS Mes ${ACTIVE_SALES} ORDER BY Anio DESC, Mes DESC`)).recordset);
    }

    static async getVentasDetalleProductoMensualFechas(producto: string, dateRange: DateRange) {
        const key = CacheService.buildCacheKey('VentasService', 'getVentasDetalleProductoMensualFechas', producto, dateRange.startYear, dateRange.startMonth, dateRange.endYear, dateRange.endMonth);
        return CacheService.cacheAside(key, async () => {
            const startPeriod = dateRange.startYear * 100 + dateRange.startMonth, endPeriod = dateRange.endYear * 100 + dateRange.endMonth;
            if (endPeriod < startPeriod) throw new Error('End date must be the same or later than start date.');
            return (await (await getPool()).request().input('producto', producto).input('startPeriod', startPeriod).input('endPeriod', endPeriod).query(`SELECT Codigo_Articulo, MAX(Ref_Articulo) AS Ref_Articulo, MAX(Descripcion_Articulo) AS Descripcion_Articulo, YEAR(Fecha) AS Anio, MONTH(Fecha) AS Mes, SUM(Cantidad) AS Total_Unidades, CAST(0 AS decimal(18, 2)) AS Total_VES, SUM(Neto_Renglon_USD) AS Total_USD, COUNT(DISTINCT Num_Nota) AS Total_Facturas ${ACTIVE_SALES} AND Codigo_Articulo = @producto AND (YEAR(Fecha) * 100 + MONTH(Fecha)) BETWEEN @startPeriod AND @endPeriod GROUP BY Codigo_Articulo, YEAR(Fecha), MONTH(Fecha) ORDER BY Anio DESC, Mes DESC`)).recordset;
        });
    }

    static async getVentasTopClientesActual() {
        return CacheService.cacheAside(CacheService.buildCacheKey('VentasService', 'getVentasTopClientesActual'), async () => (await (await getPool()).request().query(`WITH ventas AS (SELECT *, YEAR(Fecha) * 100 + MONTH(Fecha) AS Periodo ${ACTIVE_SALES}) SELECT TOP 10 Codigo_Cliente, MAX(Nombre_Cliente) AS Nombre_Cliente, SUM(Neto_Renglon_USD) AS Total_USD FROM ventas WHERE Periodo = (SELECT MAX(Periodo) FROM ventas) GROUP BY Codigo_Cliente ORDER BY Total_USD DESC`)).recordset);
    }

    static async getVentasClientesPorProducto(producto: string) {
        const key = CacheService.buildCacheKey('VentasService', 'getVentasClientesPorProducto', producto);
        return CacheService.cacheAside(key, async () => (await (await getPool()).request().input('producto', producto).query(`SELECT Codigo_Articulo, MAX(Ref_Articulo) AS Ref_Articulo, MAX(Descripcion_Articulo) AS Descripcion_Articulo, Codigo_Cliente, MAX(Nombre_Cliente) AS Nombre_Cliente, SUM(Cantidad) AS Total_Unidades, CAST(0 AS decimal(18, 2)) AS Total_VES, SUM(Neto_Renglon_USD) AS Total_USD, COUNT(DISTINCT Num_Nota) AS Total_Facturas ${ACTIVE_SALES} AND Codigo_Articulo = @producto GROUP BY Codigo_Articulo, Codigo_Cliente ORDER BY Total_USD DESC`)).recordset);
    }

    static async getVentasDetallePorCliente(cliente: string) {
        const key = CacheService.buildCacheKey('VentasService', 'getVentasDetallePorCliente', cliente);
        return CacheService.cacheAside(key, async () => (await (await getPool()).request().input('cliente', cliente).query(`SELECT Codigo_Cliente, MAX(Nombre_Cliente) AS Nombre_Cliente, YEAR(Fecha) AS Anio, MONTH(Fecha) AS Mes, SUM(Cantidad) AS Total_Unidades, CAST(0 AS decimal(18, 2)) AS Total_VES, SUM(Neto_Renglon_USD) AS Total_USD, COUNT(DISTINCT Num_Nota) AS Total_Facturas ${ACTIVE_SALES} AND Codigo_Cliente = @cliente GROUP BY Codigo_Cliente, YEAR(Fecha), MONTH(Fecha) ORDER BY Anio DESC, Mes DESC`)).recordset);
    }

    static async getVentasAgrupadoPorClienteAnual() {
        return CacheService.cacheAside(CacheService.buildCacheKey('VentasService', 'getVentasAgrupadoPorClienteAnual'), async () => (await (await getPool()).request().query(`SELECT Codigo_Cliente, MAX(Nombre_Cliente) AS Nombre_Cliente, SUM(Neto_Renglon_USD) AS Total_USD ${ACTIVE_SALES} GROUP BY Codigo_Cliente ORDER BY Total_USD DESC`)).recordset);
    }

    static async getVentasAgrupadoAnualPorMesPorProducto() {
        const sums = Array.from({ length: 12 }, (_, index) => `SUM(CASE WHEN MONTH(Fecha) = ${index + 1} THEN Neto_Renglon_USD ELSE 0 END) AS ${['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][index]}`).join(', ');
        const units = Array.from({ length: 12 }, (_, index) => `SUM(CASE WHEN MONTH(Fecha) = ${index + 1} THEN Cantidad ELSE 0 END) AS ${['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][index]}_Unidades`).join(', ');
        return CacheService.cacheAside(CacheService.buildCacheKey('VentasService', 'getVentasAgrupadoAnualPorMesPorProducto'), async () => (await (await getPool()).request().query(`SELECT Codigo_Articulo, MAX(Ref_Articulo) AS Ref_Articulo, MAX(Descripcion_Articulo) AS Descripcion_Articulo, YEAR(Fecha) AS Anio, ${sums}, ${units} ${ACTIVE_SALES} GROUP BY Codigo_Articulo, YEAR(Fecha) ORDER BY Codigo_Articulo, Anio`)).recordset);
    }

    static async getVentasProductoPorCliente(cliente: string) {
        const key = CacheService.buildCacheKey('VentasService', 'getVentasProductoPorCliente', cliente);
        return CacheService.cacheAside(key, async () => (await (await getPool()).request().input('cliente', cliente).query(`SELECT Codigo_Articulo, MAX(Ref_Articulo) AS Ref_Articulo, MAX(Descripcion_Articulo) AS Descripcion_Articulo, Codigo_Cliente, MAX(Nombre_Cliente) AS Nombre_Cliente, SUM(Cantidad) AS Total_Unidades, CAST(0 AS decimal(18, 2)) AS Total_VES, SUM(Neto_Renglon_USD) AS Total_USD, COUNT(DISTINCT Num_Nota) AS Total_Facturas ${ACTIVE_SALES} AND Codigo_Cliente = @cliente GROUP BY Codigo_Articulo, Codigo_Cliente ORDER BY Total_USD DESC`)).recordset);
    }

    static async getVentasDetallePorMesPorAnio(year: string, month: string) {
        const key = CacheService.buildCacheKey('VentasService', 'getVentasDetallePorMesPorAnio', year, month);
        return CacheService.cacheAside(key, async () => (await (await getPool()).request().input('year', year).input('month', month).query(`SELECT Fecha, Num_Nota, Codigo_Cliente, Nombre_Cliente, Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, Codigo_Almacen, Cantidad AS Total_Unidades, Precio_Unitario_USD, Descuento_USD, Neto_Renglon_USD AS Total_USD, CAST(0 AS decimal(18, 2)) AS Total_VES ${ACTIVE_SALES} AND Fecha >= DATEFROMPARTS(@year, @month, 1) AND Fecha < DATEADD(MONTH, 1, DATEFROMPARTS(@year, @month, 1)) ORDER BY Fecha DESC`)).recordset);
    }
}
