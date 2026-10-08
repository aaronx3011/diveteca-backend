import sql from 'mssql';
import { getPool } from '../config/database';
import { buildInventoryReportQuery, INVENTORY_REPORT_ROW_LIMIT, INVENTORY_REPORT_TIMEOUT_MS, InventorySourceDatabase } from '../queries/inventoryReportQuery';
import type { InventoryByExpiry, InventoryByProduct, InventoryDetailTotals, InventoryItem, InventoryMetadata, InventoryReportResult, InventoryTotal, RawInventoryReportRow, ReplenishmentFilter, ReplenishmentItem } from '../types/inventory';

interface SourceResult { rows: RawInventoryReportRow[]; reachedLimit: boolean; }
interface SalesVelocityRow { Codigo_Articulo: string; Promedio_Mensual_Unidades: number | string | null; }

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const nullableNumber = (value: number | string | null): number | null => {
    if (value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};
const requiredNumber = (value: number | string) => nullableNumber(value) ?? 0;
const toIsoDate = (value: Date | string | null): string | null => {
    if (value === null) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const dayDifference = (from: Date, to: Date) => Math.round((Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()) - Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())) / 86400000);

export class InventoryReportService {
    private static fullReportInFlight: Promise<InventoryReportResult> | null = null;

    private static async executeSource(database: InventorySourceDatabase, codigoArticulo?: string): Promise<SourceResult> {
        const pool = await getPool();
        const createRequest = pool.request.bind(pool) as unknown as (options: { requestTimeout: number }) => sql.Request;
        const request = createRequest({ requestTimeout: INVENTORY_REPORT_TIMEOUT_MS });
        request.input('FiltroArticuloDesde', sql.Char(30), codigoArticulo ?? null);
        request.input('FiltroArticuloHasta', sql.Char(30), codigoArticulo ?? null);
        const result = await request.batch<RawInventoryReportRow>(buildInventoryReportQuery(database));
        const rows = result.recordset ?? [];
        return { rows, reachedLimit: rows.length === INVENTORY_REPORT_ROW_LIMIT };
    }

    private static mapRow(row: RawInventoryReportRow): InventoryItem {
        return {
            Codigo_Articulo: row.Código.trim(), Ref_Articulo: row.Referencia?.trim() ?? '', Nombre_Articulo: row.Descripción.trim(), Unidad: row.Unidad.trim(),
            Codigo_Almacen: row['cod.Alm'].trim(), Nombre_Almacen: row.Almacén.trim(), Unidades: requiredNumber(row['Stock Actual']),
            Fecha_Vencimiento: toIsoDate(row['Fecha Lote']), Lote: row.Lote.trim(), Estado_Lote: row.Status.trim().toLowerCase() === 'vigente' ? 'Vigente' : 'Vencido',
            Ultimo_Precio_Venta_USD: nullableNumber(row.Precio), Ultimo_Costo_Compra_USD: nullableNumber(row['Costo Uni']),
            Total_Ultimo_Precio_Venta_USD: nullableNumber(row['Total Precio']), Total_Ultimo_Costo_Compra_USD: nullableNumber(row['Total Costo']),
        };
    }

    private static async loadReport(codigoArticulo?: string): Promise<InventoryReportResult> {
        const normalizedCode = codigoArticulo?.trim().toUpperCase();
        const sources: InventorySourceDatabase[] = ['A_DIVETE_A'];
        const sourceResults = await Promise.all(sources.map(source => this.executeSource(source, normalizedCode)));
        const rows = sourceResults.flatMap(result => result.rows).map(row => this.mapRow(row)).sort((left, right) => left.Codigo_Articulo.localeCompare(right.Codigo_Articulo) || left.Codigo_Almacen.localeCompare(right.Codigo_Almacen) || left.Lote.localeCompare(right.Lote));
        const data = rows.slice(0, INVENTORY_REPORT_ROW_LIMIT);
        return { metadata: { source: 'inventory-movement-report', generatedAt: new Date().toISOString(), rowLimit: INVENTORY_REPORT_ROW_LIMIT, possiblyTruncated: sourceResults.some(result => result.reachedLimit) || rows.length > INVENTORY_REPORT_ROW_LIMIT, count: data.length }, data };
    }

    static async getReport(codigoArticulo?: string): Promise<InventoryReportResult> {
        if (codigoArticulo) return this.loadReport(codigoArticulo);
        if (this.fullReportInFlight) return this.fullReportInFlight;
        const execution = this.loadReport();
        this.fullReportInFlight = execution;
        try { return await execution; } finally { if (this.fullReportInFlight === execution) this.fullReportInFlight = null; }
    }

    static calculateDetailTotals(data: InventoryItem[]): InventoryDetailTotals {
        return data.reduce<InventoryDetailTotals>((totals, row) => ({
            Unidades: round(totals.Unidades + row.Unidades), Ultimo_Precio_Venta_USD: round(totals.Ultimo_Precio_Venta_USD + (row.Ultimo_Precio_Venta_USD ?? 0)),
            Total_Ultimo_Precio_Venta_USD: round(totals.Total_Ultimo_Precio_Venta_USD + (row.Total_Ultimo_Precio_Venta_USD ?? 0)),
            Ultimo_Costo_Compra_USD: round(totals.Ultimo_Costo_Compra_USD + (row.Ultimo_Costo_Compra_USD ?? 0)),
            Total_Ultimo_Costo_Compra_USD: round(totals.Total_Ultimo_Costo_Compra_USD + (row.Total_Ultimo_Costo_Compra_USD ?? 0)),
        }), { Unidades: 0, Ultimo_Precio_Venta_USD: 0, Total_Ultimo_Precio_Venta_USD: 0, Ultimo_Costo_Compra_USD: 0, Total_Ultimo_Costo_Compra_USD: 0 });
    }

    static calculateInventoryTotal(data: InventoryItem[]): InventoryTotal {
        const totals = this.calculateDetailTotals(data);
        return { Total_Items_Distintos: new Set(data.map(row => row.Codigo_Articulo)).size, Total_Unidades_Fisicas: totals.Unidades, Valor_Total_Costo_USD: totals.Total_Ultimo_Costo_Compra_USD, Valor_Total_Venta_USD: totals.Total_Ultimo_Precio_Venta_USD, Ganancia_Proyectada_USD: round(totals.Total_Ultimo_Precio_Venta_USD - totals.Total_Ultimo_Costo_Compra_USD) };
    }

    static aggregateByProduct(data: InventoryItem[]): InventoryByProduct[] {
        const groups = new Map<string, { item: InventoryItem; warehouses: Set<string>; units: number; sale: number; cost: number; expiry: string | null; unitPrice: number | null; unitCost: number | null; }>();
        for (const row of data) {
            const group = groups.get(row.Codigo_Articulo) ?? { item: row, warehouses: new Set<string>(), units: 0, sale: 0, cost: 0, expiry: null, unitPrice: row.Ultimo_Precio_Venta_USD, unitCost: row.Ultimo_Costo_Compra_USD };
            group.warehouses.add(row.Codigo_Almacen); group.units += row.Unidades; group.sale += row.Total_Ultimo_Precio_Venta_USD ?? 0; group.cost += row.Total_Ultimo_Costo_Compra_USD ?? 0;
            if (row.Fecha_Vencimiento && (!group.expiry || row.Fecha_Vencimiento < group.expiry)) group.expiry = row.Fecha_Vencimiento;
            groups.set(row.Codigo_Articulo, group);
        }
        return Array.from(groups.values()).map(group => ({ Codigo_Articulo: group.item.Codigo_Articulo, Ref_Articulo: group.item.Ref_Articulo, Nombre_Articulo: group.item.Nombre_Articulo, Unidad: group.item.Unidad, Almacenes_Distintos: group.warehouses.size, Total_Unidades: round(group.units), Proximo_Vencimiento: group.expiry, Total_Valor_Venta_USD: round(group.sale), Total_Valor_Costo_USD: round(group.cost), Ultimo_Precio_Venta_USD: group.unitPrice, Ultimo_Costo_Compra_USD: group.unitCost }));
    }

    static aggregateByExpiry(data: InventoryItem[]): InventoryByExpiry[] {
        const groups = new Map<string, { year: number; month: number; articles: Set<string>; units: number; sale: number; cost: number; }>();
        for (const row of data) {
            if (!row.Fecha_Vencimiento) continue;
            const expiry = new Date(row.Fecha_Vencimiento); if (Number.isNaN(expiry.getTime())) continue;
            const year = expiry.getUTCFullYear(), month = expiry.getUTCMonth() + 1, key = `${year}-${month}`;
            const group = groups.get(key) ?? { year, month, articles: new Set<string>(), units: 0, sale: 0, cost: 0 };
            group.articles.add(row.Codigo_Articulo); group.units += row.Unidades; group.sale += row.Total_Ultimo_Precio_Venta_USD ?? 0; group.cost += row.Total_Ultimo_Costo_Compra_USD ?? 0; groups.set(key, group);
        }
        return Array.from(groups.values()).sort((left, right) => left.year - right.year || left.month - right.month).map(group => ({ Anio: group.year, Mes: group.month, Productos_Distintos: group.articles.size, Total_Unidades: round(group.units), Total_Valor_Venta_USD: round(group.sale), Total_Valor_Costo_USD: round(group.cost) }));
    }

    static async getCompleteReport(): Promise<InventoryReportResult> {
        const [report, excluded] = await Promise.all([this.getReport(), this.getExcludedWarehouseCodes()]);
        const data = report.data.filter(row => !excluded.has(row.Codigo_Almacen));
        return { metadata: { ...report.metadata, count: data.length }, data };
    }

    private static async getExcludedWarehouseCodes() {
        const result = await (await getPool()).request().query<{ Codigo_Almacen: string }>('SELECT Codigo_Almacen FROM [aaron_AlmacenesExcluidos]');
        return new Set(result.recordset.map(row => row.Codigo_Almacen.trim()));
    }

    private static async getSalesVelocity() {
        const result = await (await getPool()).request().query<SalesVelocityRow>('SELECT Codigo_Articulo, Promedio_Mensual_Unidades FROM [aaron_view_PromedioVentasUltimoAnio]');
        return new Map(result.recordset.map(row => [row.Codigo_Articulo.trim(), nullableNumber(row.Promedio_Mensual_Unidades) ?? 0]));
    }

    static async getReplenishment(filter: ReplenishmentFilter): Promise<{ metadata: InventoryMetadata; data: ReplenishmentItem[] }> {
        const [report, velocity] = await Promise.all([this.getReport(), this.getSalesVelocity()]);
        const now = new Date();
        const data = this.aggregateByProduct(report.data).map(product => {
            const expiry = product.Proximo_Vencimiento ? new Date(product.Proximo_Vencimiento) : null;
            const days = expiry ? dayDifference(now, expiry) : null, expired = days !== null && days < 0, critical = days !== null && days >= 0 && days <= 30;
            const average = velocity.get(product.Codigo_Articulo) ?? 0, months = expired ? 0 : average > 0 ? round(product.Total_Unidades / average) : null;
            return { Codigo_Articulo: product.Codigo_Articulo, Ref_Articulo: product.Ref_Articulo, Descripcion_Articulo: product.Nombre_Articulo, Stock_Total: product.Total_Unidades, Proximo_Vencimiento: product.Proximo_Vencimiento, Estado_Stock: expired ? 'VENCIDO' as const : critical ? 'CRITICO' as const : 'VIGENTE' as const, Venta_Promedio_Mensual_Actual: average, Meses_De_Inventario_Restante: months, Meta_Venta_Mensual_Para_No_Perder: expired || critical ? product.Total_Unidades : days !== null && days > 0 ? round(product.Total_Unidades / (days / 30)) : null, Ultimo_Precio_Venta_USD: product.Ultimo_Precio_Venta_USD, Ultimo_Costo_Compra_USD: product.Ultimo_Costo_Compra_USD };
        }).filter(row => {
            const days = row.Proximo_Vencimiento ? dayDifference(now, new Date(row.Proximo_Vencimiento)) : null;
            if (filter === 'activo') return days !== null && days >= 0;
            if (filter === 'critico') return days !== null && days >= 0 && days <= 30;
            return filter !== 'stock-bajo' || (days !== null && days >= 0 && row.Venta_Promedio_Mensual_Actual > 0 && row.Meses_De_Inventario_Restante !== null && row.Meses_De_Inventario_Restante <= 3);
        });
        return { metadata: { ...report.metadata, count: data.length }, data };
    }
}
