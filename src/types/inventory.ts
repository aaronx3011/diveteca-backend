export interface RawInventoryReportRow {
    Referencia: string | null;
    Código: string;
    Descripción: string;
    Unidad: string;
    'cod.Alm': string;
    Almacén: string;
    Lote: string;
    'Fecha Lote': Date | string | null;
    'Stock Actual': number | string;
    Status: string;
    Precio: number | string | null;
    'Total Precio': number | string | null;
    'Costo Uni': number | string | null;
    'Total Costo': number | string | null;
}

export interface InventoryItem {
    Codigo_Articulo: string;
    Ref_Articulo: string;
    Nombre_Articulo: string;
    Unidad: string;
    Codigo_Almacen: string;
    Nombre_Almacen: string;
    Unidades: number;
    Fecha_Vencimiento: string | null;
    Lote: string;
    Estado_Lote: 'Vigente' | 'Vencido';
    Ultimo_Precio_Venta_USD: number | null;
    Ultimo_Costo_Compra_USD: number | null;
    Total_Ultimo_Precio_Venta_USD: number | null;
    Total_Ultimo_Costo_Compra_USD: number | null;
}

export interface InventoryMetadata {
    source: 'inventory-movement-report';
    generatedAt: string;
    rowLimit: number;
    possiblyTruncated: boolean;
    count: number;
}

export interface InventoryReportResult {
    metadata: InventoryMetadata;
    data: InventoryItem[];
}

export interface InventoryDetailTotals {
    Unidades: number;
    Ultimo_Precio_Venta_USD: number;
    Total_Ultimo_Precio_Venta_USD: number;
    Ultimo_Costo_Compra_USD: number;
    Total_Ultimo_Costo_Compra_USD: number;
}

export interface InventoryTotal {
    Total_Items_Distintos: number;
    Total_Unidades_Fisicas: number;
    Valor_Total_Costo_USD: number;
    Valor_Total_Venta_USD: number;
    Ganancia_Proyectada_USD: number;
}

export interface InventoryByProduct {
    Codigo_Articulo: string;
    Ref_Articulo: string;
    Nombre_Articulo: string;
    Unidad: string;
    Almacenes_Distintos: number;
    Total_Unidades: number;
    Proximo_Vencimiento: string | null;
    Total_Valor_Venta_USD: number;
    Total_Valor_Costo_USD: number;
    Ultimo_Precio_Venta_USD: number | null;
    Ultimo_Costo_Compra_USD: number | null;
}

export interface InventoryByExpiry {
    Anio: number;
    Mes: number;
    Productos_Distintos: number;
    Total_Unidades: number;
    Total_Valor_Venta_USD: number;
    Total_Valor_Costo_USD: number;
}

export interface ReplenishmentItem {
    Codigo_Articulo: string;
    Ref_Articulo: string;
    Descripcion_Articulo: string;
    Stock_Total: number;
    Proximo_Vencimiento: string | null;
    Estado_Stock: 'VENCIDO' | 'CRITICO' | 'VIGENTE';
    Venta_Promedio_Mensual_Actual: number;
    Meses_De_Inventario_Restante: number | null;
    Meta_Venta_Mensual_Para_No_Perder: number | null;
    Ultimo_Precio_Venta_USD: number | null;
    Ultimo_Costo_Compra_USD: number | null;
}

export type ReplenishmentFilter = 'all' | 'critico' | 'stock-bajo' | 'activo';
