export type InventorySourceDatabase = 'A_MEDVAL_A';

export const INVENTORY_REPORT_ROW_LIMIT = 10000;
export const INVENTORY_REPORT_TIMEOUT_MS = 120000;

export function buildInventoryReportQuery(database: InventorySourceDatabase): string {
    const db = `[${database}].[dbo]`;

    return `
DECLARE @NoCountWasOn BIT = CASE WHEN (512 & @@OPTIONS) = 512 THEN 1 ELSE 0 END;
SET NOCOUNT ON;

BEGIN TRY
    DROP TABLE IF EXISTS #ArticulosConStock;
    DROP TABLE IF EXISTS #StockPorAsignar;
    DROP TABLE IF EXISTS #StockActual;
    DROP TABLE IF EXISTS #Candidatos;

    DECLARE @ArticuloDesde CHAR(30) = @FiltroArticuloDesde;
    DECLARE @ArticuloHasta CHAR(30) = @FiltroArticuloHasta;
    DECLARE @FechaActual DATETIME = ${db}.[FechaSimple](GETDATE());
    DECLARE @FechaLimiteExclusiva DATETIME = DATEADD(DAY, 1, @FechaActual);

    ;WITH LotesFiltrados AS (
        SELECT LE.co_art, LE.co_alma, LE.numero_lote, LE.fecha_expiracion,
            ROW_NUMBER() OVER (
                PARTITION BY LE.co_art, LE.co_alma, LE.numero_lote
                ORDER BY CASE WHEN LE.fecha_expiracion IS NULL THEN 1 ELSE 0 END, LE.fecha_expiracion ASC
            ) AS NumeroFila
        FROM ${db}.[saLoteEntrada] AS LE
        INNER JOIN ${db}.[saArticulo] AS A ON A.co_art = LE.co_art
        INNER JOIN ${db}.[saAlmacen] AS AL ON AL.co_alma = LE.co_alma
        WHERE LE.numero_lote IS NOT NULL
            AND LTRIM(RTRIM(LE.numero_lote)) <> ''
            AND LE.co_alma IS NOT NULL
            AND LTRIM(RTRIM(LE.co_alma)) <> ''
            AND LTRIM(RTRIM(LE.co_alma)) <> 'CON'
            AND EXISTS (SELECT 1 FROM ${db}.[saArtUnidad] AS AU WHERE AU.co_art = A.co_art AND AU.uni_principal = 1)
            AND (@ArticuloDesde IS NULL OR A.co_art >= @ArticuloDesde)
            AND (@ArticuloHasta IS NULL OR A.co_art <= @ArticuloHasta)
    )
    SELECT LF.co_art, LF.co_alma, LF.numero_lote, LF.fecha_expiracion
    INTO #Candidatos FROM LotesFiltrados AS LF WHERE LF.NumeroFila = 1 OPTION (RECOMPILE);

    CREATE UNIQUE CLUSTERED INDEX IX_Candidatos ON #Candidatos (co_art, co_alma, numero_lote);

    ;WITH CandidatosLote AS (
        SELECT C.co_art, C.co_alma, C.numero_lote FROM #Candidatos AS C
        WHERE LTRIM(RTRIM(C.numero_lote)) <> 'Por Asignar'
    ), Movimientos AS (
        SELECT C.co_art, C.co_alma, C.numero_lote, LS.cantidad * (-1) AS cantidad FROM CandidatosLote AS C
        INNER JOIN ${db}.[StockActAjusteLote] AS M ON M.co_art = C.co_art AND M.co_alma = C.co_alma
        INNER JOIN ${db}.[saLoteSalida] AS LS ON LS.rowguid_reng = M.rowguid AND LS.co_art = M.co_art AND LS.tipo_doc = 'AJUS' AND LS.numero_lote = C.numero_lote
        WHERE M.fecha < @FechaLimiteExclusiva
        UNION ALL SELECT C.co_art, C.co_alma, C.numero_lote, LE.cantidad FROM CandidatosLote AS C
        INNER JOIN ${db}.[StockActAjusteLote] AS M ON M.co_art = C.co_art AND M.co_alma = C.co_alma
        INNER JOIN ${db}.[saLoteEntrada] AS LE ON LE.rowguid_reng = M.rowguid AND LE.co_art = M.co_art AND LE.tipo_doc = 'AJUS' AND LE.numero_lote = C.numero_lote
        WHERE M.fecha < @FechaLimiteExclusiva
        UNION ALL SELECT C.co_art, C.co_alma, C.numero_lote, LS.cantidad * (-1) FROM CandidatosLote AS C
        INNER JOIN ${db}.[StockActTrasladoOriLote] AS M ON M.co_art = C.co_art AND M.co_alma = C.co_alma
        INNER JOIN ${db}.[saLoteSalida] AS LS ON LS.rowguid_reng = M.rowguid AND LS.co_art = M.co_art AND LS.tipo_doc = 'TRAS' AND LS.numero_lote = C.numero_lote
        WHERE M.fecha < @FechaLimiteExclusiva
        UNION ALL SELECT C.co_art, C.co_alma, C.numero_lote, LS.cantidad FROM CandidatosLote AS C
        INNER JOIN ${db}.[StockActTrasladoTempLote] AS M ON M.co_art = C.co_art AND M.co_alma = C.co_alma
        INNER JOIN ${db}.[saLoteSalida] AS LS ON LS.rowguid_reng = M.rowguid AND LS.co_art = M.co_art AND LS.tipo_doc = 'TRAS' AND LS.numero_lote = C.numero_lote
        WHERE M.fecha < @FechaLimiteExclusiva
        UNION ALL SELECT C.co_art, C.co_alma, C.numero_lote, LE.cantidad FROM CandidatosLote AS C
        INNER JOIN ${db}.[StockActTrasladoDestLote] AS M ON M.co_art = C.co_art AND M.co_alma = C.co_alma
        INNER JOIN ${db}.[saLoteEntrada] AS LE ON LE.rowguid_reng = M.rowguid AND LE.co_art = M.co_art AND LE.tipo_doc = 'TRAS' AND LE.numero_lote = C.numero_lote
        WHERE M.fecha < @FechaLimiteExclusiva
        UNION ALL SELECT C.co_art, C.co_alma, C.numero_lote, LE.cantidad FROM CandidatosLote AS C
        INNER JOIN ${db}.[StockActNotaRecepcionCompraLote] AS M ON M.co_art = C.co_art AND M.co_alma = C.co_alma
        INNER JOIN ${db}.[saLoteEntrada] AS LE ON LE.rowguid_reng = M.rowguid AND LE.co_art = M.co_art AND LE.tipo_doc = 'NREC' AND LE.numero_lote = C.numero_lote
        WHERE M.fecha < @FechaLimiteExclusiva
        UNION ALL SELECT C.co_art, C.co_alma, C.numero_lote, LE.cantidad FROM CandidatosLote AS C
        INNER JOIN ${db}.[StockActDevolucionVentaLote] AS M ON M.co_art = C.co_art AND M.co_alma = C.co_alma
        INNER JOIN ${db}.[saLoteEntrada] AS LE ON LE.rowguid_reng = M.rowguid AND LE.co_art = M.co_art AND LE.tipo_doc = 'DCLI' AND LE.numero_lote = C.numero_lote
        WHERE M.fecha < @FechaLimiteExclusiva
        UNION ALL SELECT C.co_art, C.co_alma, C.numero_lote, LE.cantidad FROM CandidatosLote AS C
        INNER JOIN ${db}.[StockActFacturaCompraLote] AS M ON M.co_art = C.co_art AND M.co_alma = C.co_alma
        INNER JOIN ${db}.[saLoteEntrada] AS LE ON LE.rowguid_reng = M.rowguid AND LE.co_art = M.co_art AND LE.tipo_doc = 'COMP' AND LE.numero_lote = C.numero_lote
        WHERE M.fecha < @FechaLimiteExclusiva
        UNION ALL SELECT C.co_art, C.co_alma, C.numero_lote, LS.cantidad * (-1) FROM CandidatosLote AS C
        INNER JOIN ${db}.[StockActFacturaVentaLote] AS M ON M.co_art = C.co_art AND M.co_alma = C.co_alma
        INNER JOIN ${db}.[saLoteSalida] AS LS ON LS.rowguid_reng = M.rowguid AND LS.co_art = M.co_art AND LS.tipo_doc = 'FACT' AND LS.numero_lote = C.numero_lote
        WHERE M.fecha < @FechaLimiteExclusiva
        UNION ALL SELECT C.co_art, C.co_alma, C.numero_lote, LS.cantidad * (-1) FROM CandidatosLote AS C
        INNER JOIN ${db}.[StockActDevolucionProveedorLote] AS M ON M.co_art = C.co_art AND M.co_alma = C.co_alma
        INNER JOIN ${db}.[saLoteSalida] AS LS ON LS.rowguid_reng = M.rowguid AND LS.co_art = M.co_art AND LS.tipo_doc = 'DPRO' AND LS.numero_lote = C.numero_lote
        WHERE M.fecha < @FechaLimiteExclusiva
        UNION ALL SELECT C.co_art, C.co_alma, C.numero_lote, LS.cantidad * (-1) FROM CandidatosLote AS C
        INNER JOIN ${db}.[StockActNotaEntregaVentaLote] AS M ON M.co_art = C.co_art AND M.co_alma = C.co_alma
        INNER JOIN ${db}.[saLoteSalida] AS LS ON LS.rowguid_reng = M.rowguid AND LS.co_art = M.co_art AND LS.tipo_doc = 'NENT' AND LS.numero_lote = C.numero_lote
        WHERE M.fecha < @FechaLimiteExclusiva
        UNION ALL SELECT C.co_art, C.co_alma, C.numero_lote, LS.cantidad * (-1) FROM CandidatosLote AS C
        INNER JOIN ${db}.[StockActNotaDespachoVentaLote] AS M ON M.co_art = C.co_art AND M.co_alma = C.co_alma
        INNER JOIN ${db}.[saLoteSalida] AS LS ON LS.rowguid_reng = M.rowguid AND LS.co_art = M.co_art AND LS.tipo_doc = 'NDES' AND LS.numero_lote = C.numero_lote
        WHERE M.fecha < @FechaLimiteExclusiva
        UNION ALL SELECT C.co_art, C.co_alma, C.numero_lote, LS.cantidad * (-1) FROM CandidatosLote AS C
        INNER JOIN ${db}.[StockActArtCompuestoGenRengLote] AS M ON M.co_art = C.co_art AND M.co_alma = C.co_alma
        INNER JOIN ${db}.[saLoteSalida] AS LS ON LS.rowguid_reng = M.rowguid AND LS.co_art = M.co_art AND LS.tipo_doc = 'GCOM' AND LS.numero_lote = C.numero_lote
        WHERE M.fecha < @FechaLimiteExclusiva
        UNION ALL SELECT C.co_art, C.co_alma, C.numero_lote, LE.cantidad FROM CandidatosLote AS C
        INNER JOIN ${db}.[StockActArtCompuestoGenLote] AS M ON M.co_art = C.co_art AND M.co_alma = C.co_alma
        INNER JOIN ${db}.[saLoteEntrada] AS LE ON LE.rowguid_reng = M.rowguid AND LE.co_art = M.co_art AND LE.tipo_doc = 'GCOM' AND LE.numero_lote = C.numero_lote
        WHERE M.fecha < @FechaLimiteExclusiva
    )
    SELECT M.co_art, M.co_alma, M.numero_lote, CAST(SUM(M.cantidad) AS DECIMAL(18, 5)) AS StockActual
    INTO #StockActual FROM Movimientos AS M
    GROUP BY M.co_art, M.co_alma, M.numero_lote
    HAVING CAST(SUM(M.cantidad) AS DECIMAL(18, 5)) > 0 OPTION (RECOMPILE);

    SELECT C.co_art, C.co_alma, C.numero_lote,
        ${db}.[ConsultarStockActualxAlmacenxFechaxLote](C.co_art, C.co_alma, @FechaActual, NULL, NULL, C.numero_lote) AS StockActual
    INTO #StockPorAsignar FROM #Candidatos AS C WHERE LTRIM(RTRIM(C.numero_lote)) = 'Por Asignar';

    INSERT INTO #StockActual (co_art, co_alma, numero_lote, StockActual)
    SELECT PA.co_art, PA.co_alma, PA.numero_lote, PA.StockActual FROM #StockPorAsignar AS PA WHERE PA.StockActual > 0;
    CREATE UNIQUE CLUSTERED INDEX IX_StockActual ON #StockActual (co_art, co_alma, numero_lote);

    SELECT DISTINCT S.co_art, A.rowguid INTO #ArticulosConStock FROM #StockActual AS S
    INNER JOIN ${db}.[saArticulo] AS A ON A.co_art = S.co_art;
    CREATE UNIQUE CLUSTERED INDEX IX_ArticulosConStock ON #ArticulosConStock (co_art);
    CREATE NONCLUSTERED INDEX IX_ArticulosConStock_Rowguid ON #ArticulosConStock (rowguid);

    ;WITH PrecioActual AS (
        SELECT AP.co_art, AP.monto, ROW_NUMBER() OVER (PARTITION BY AP.co_art ORDER BY AP.desde DESC) AS NumeroFila
        FROM ${db}.[saArtPrecio] AS AP INNER JOIN #ArticulosConStock AS ACS ON ACS.co_art = AP.co_art
        WHERE AP.co_precio = '01'
    ), CostoActual AS (
        SELECT CE.cod_articulo_rowguid, CE.costo, ROW_NUMBER() OVER (PARTITION BY CE.cod_articulo_rowguid ORDER BY CE.fecha_emision DESC) AS NumeroFila
        FROM ${db}.[saCostoHistoricoEntrada] AS CE INNER JOIN #ArticulosConStock AS ACS ON ACS.rowguid = CE.cod_articulo_rowguid
        WHERE CE.tipo_doc = 'REPO'
    )
    SELECT DISTINCT TOP (${INVENTORY_REPORT_ROW_LIMIT}) RTRIM(A.ref) AS [Referencia], RTRIM(A.co_art) AS [Código],
        RTRIM(A.art_des) AS [Descripción], RTRIM(AU.co_uni) AS [Unidad], RTRIM(AL.co_alma) AS [cod.Alm],
        RTRIM(AL.des_alma) AS [Almacén], RTRIM(S.numero_lote) AS [Lote], C.fecha_expiracion AS [Fecha Lote],
        CAST(S.StockActual AS DECIMAL(18, 2)) AS [Stock Actual],
        CASE WHEN C.fecha_expiracion > GETDATE() THEN 'Vigente' ELSE 'Vencido' END AS [Status],
        CAST(ROUND(PA.monto, 2) AS DECIMAL(18, 2)) AS [Precio], CAST(ROUND(S.StockActual * PA.monto, 2) AS DECIMAL(18, 2)) AS [Total Precio],
        CAST(ROUND(CA.costo, 2) AS DECIMAL(18, 2)) AS [Costo Uni], CAST(ROUND(S.StockActual * CA.costo, 2) AS DECIMAL(18, 2)) AS [Total Costo]
    FROM #StockActual AS S
    INNER JOIN #Candidatos AS C ON C.co_art = S.co_art AND C.co_alma = S.co_alma AND C.numero_lote = S.numero_lote
    INNER JOIN ${db}.[saArticulo] AS A ON A.co_art = S.co_art
    INNER JOIN ${db}.[saAlmacen] AS AL ON AL.co_alma = S.co_alma
    INNER JOIN ${db}.[saArtUnidad] AS AU ON AU.co_art = A.co_art AND AU.uni_principal = 1
    LEFT JOIN PrecioActual AS PA ON PA.co_art = A.co_art AND PA.NumeroFila = 1
    LEFT JOIN CostoActual AS CA ON CA.cod_articulo_rowguid = A.rowguid AND CA.NumeroFila = 1
    ORDER BY [Código] ASC, [cod.Alm] ASC, [Lote] ASC;

    DROP TABLE IF EXISTS #ArticulosConStock;
    DROP TABLE IF EXISTS #StockPorAsignar;
    DROP TABLE IF EXISTS #StockActual;
    DROP TABLE IF EXISTS #Candidatos;
    IF @NoCountWasOn = 0 SET NOCOUNT OFF;
END TRY
BEGIN CATCH
    DROP TABLE IF EXISTS #ArticulosConStock;
    DROP TABLE IF EXISTS #StockPorAsignar;
    DROP TABLE IF EXISTS #StockActual;
    DROP TABLE IF EXISTS #Candidatos;
    IF @NoCountWasOn = 0 SET NOCOUNT OFF;
    THROW;
END CATCH;
`;
}
