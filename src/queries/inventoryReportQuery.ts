export type InventorySourceDatabase = 'N_DIVETE_A';

export const INVENTORY_REPORT_ROW_LIMIT = 10000;
export const INVENTORY_REPORT_TIMEOUT_MS = 120000;

// Diveteca maintains live inventory per warehouse in saStockAlmacen, not saLoteEntrada.
export function buildInventoryReportQuery(database: InventorySourceDatabase): string {
    const db = `[${database}].[dbo]`;

    return `
SELECT TOP (${INVENTORY_REPORT_ROW_LIMIT})
    COALESCE(NULLIF(RTRIM(A.ref), ''), RTRIM(A.co_art)) AS [Referencia],
    RTRIM(A.co_art) AS [Código],
    RTRIM(A.art_des) AS [Descripción],
    RTRIM(ISNULL(AU.co_uni, '')) AS [Unidad],
    RTRIM(S.co_alma) AS [cod.Alm],
    RTRIM(AL.des_alma) AS [Almacén],
    'Sin lote' AS [Lote],
    CAST(NULL AS DATETIME) AS [Fecha Lote],
    CAST(S.stock AS DECIMAL(18, 2)) AS [Stock Actual],
    'Vigente' AS [Status],
    CAST(ROUND(PA.monto, 2) AS DECIMAL(18, 2)) AS [Precio],
    CAST(ROUND(S.stock * PA.monto, 2) AS DECIMAL(18, 2)) AS [Total Precio],
    CAST(ROUND(CA.costo, 2) AS DECIMAL(18, 2)) AS [Costo Uni],
    CAST(ROUND(S.stock * CA.costo, 2) AS DECIMAL(18, 2)) AS [Total Costo]
FROM ${db}.[saStockAlmacen] AS S
INNER JOIN ${db}.[saArticulo] AS A ON A.co_art = S.co_art
INNER JOIN ${db}.[saAlmacen] AS AL ON AL.co_alma = S.co_alma
LEFT JOIN ${db}.[saArtUnidad] AS AU ON AU.co_art = A.co_art AND AU.uni_principal = 1
OUTER APPLY (
    SELECT TOP 1 AP.monto
    FROM ${db}.[saArtPrecio] AS AP
    WHERE AP.co_art = A.co_art AND AP.co_precio = '01'
    ORDER BY AP.desde DESC
) AS PA
OUTER APPLY (
    SELECT TOP 1 CE.costo
    FROM ${db}.[saCostoHistoricoEntrada] AS CE
    WHERE CE.cod_articulo_rowguid = A.rowguid AND CE.tipo_doc = 'REPO'
    ORDER BY CE.fecha_emision DESC
) AS CA
WHERE S.stock > 0
    AND A.anulado = 0
    AND (@FiltroArticuloDesde IS NULL OR A.co_art >= @FiltroArticuloDesde)
    AND (@FiltroArticuloHasta IS NULL OR A.co_art <= @FiltroArticuloHasta)
ORDER BY [Código], [cod.Alm];
`;
}
