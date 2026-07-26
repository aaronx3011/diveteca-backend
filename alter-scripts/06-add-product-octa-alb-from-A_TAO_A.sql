-- ===================================================================
-- Script: 06-add-product-octa-alb-from-A_TAO_A.sql
-- Purpose: Add product OCTA-ALB from [A_TAO_A] to all views.
--          OCTA-ALB and ALL its transactions (sales, inventory,
--          purchases, pricing) exist only in A_TAO_A, not A_MEDVAL_A.
-- Strategy: Each leaf view UNIONs transactional data from both
--           databases, filtering A_TAO_A data by co_art = 'OCTA-ALB'.
-- Run in: SQL Server Management Studio
-- ===================================================================

PRINT '========================================';
PRINT 'Migration: Add product OCTA-ALB from A_TAO_A';
PRINT '========================================';
GO

-- ===================================================================
-- VIEW 1: aaron_view_DetalleVentasDolarizadas
-- Desc: Base leaf view for ALL sales-derived views (13+ views).
--       UNION sales from A_TAO_A where product is OCTA-ALB.
-- ===================================================================
USE [Desarrollo]
GO

ALTER VIEW [dbo].[aaron_view_DetalleVentasDolarizadas] 
AS
SELECT 
    f.doc_num AS [Factura],
    f.fec_emis AS [Fecha_Emision],
    f.co_cli AS [Codigo_Cliente],
    c.cli_des AS [Nombre_Cliente],
    c.tip_cli AS [Tipo_Cliente],
    c.direc1 AS [Direccion_Fiscal],
    c.fecha_reg AS [Fecha_Registro_Cliente],
    r.co_art AS [Codigo_Articulo],
    a.ref AS [Ref_Articulo],
    COALESCE(a.art_des, r.des_art) AS [Descripcion_Articulo],
    r.total_art AS [Cantidad],
    r.reng_neto AS [Monto_Renglon_VES],
    TasaHist.tasa_v AS [Tasa_USD_Aplicada],
    CAST(r.reng_neto / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Monto_Renglon_USD],
    f.co_ven AS [Vendedor],
    f.co_sucu_in AS [Sucursal],
    'tipo' AS [tipo]
FROM [A_MEDVAL_A].[dbo].[saFacturaVenta] AS f
INNER JOIN [A_MEDVAL_A].[dbo].[saFacturaVentaReng] AS r ON f.doc_num = r.doc_num
LEFT JOIN [A_MEDVAL_A].[dbo].[saCliente] AS c ON f.co_cli = c.co_cli
LEFT JOIN [A_MEDVAL_A].[dbo].[saArticulo] AS a ON r.co_art = a.co_art
OUTER APPLY (
    SELECT TOP 1 t.tasa_v
    FROM [A_MEDVAL_A].[dbo].[saTasa] AS t
    WHERE t.co_mone = 'USD'
      AND CAST(t.fecha AS DATE) <= CAST(f.fec_emis AS DATE)
    ORDER BY t.fecha DESC
) AS TasaHist
WHERE f.anulado = 0

UNION ALL

SELECT 
    f.doc_num AS [Factura],
    f.fec_emis AS [Fecha_Emision],
    f.co_cli AS [Codigo_Cliente],
    c.cli_des AS [Nombre_Cliente],
    c.tip_cli AS [Tipo_Cliente],
    c.direc1 AS [Direccion_Fiscal],
    c.fecha_reg AS [Fecha_Registro_Cliente],
    r.co_art AS [Codigo_Articulo],
    a.ref AS [Ref_Articulo],
    COALESCE(a.art_des, r.des_art) AS [Descripcion_Articulo],
    r.total_art AS [Cantidad],
    r.reng_neto AS [Monto_Renglon_VES],
    TasaHist.tasa_v AS [Tasa_USD_Aplicada],
    CAST(r.reng_neto / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Monto_Renglon_USD],
    f.co_ven AS [Vendedor],
    f.co_sucu_in AS [Sucursal],
    'tipo' AS [tipo]
FROM [A_TAO_A].[dbo].[saFacturaVenta] AS f
INNER JOIN [A_TAO_A].[dbo].[saFacturaVentaReng] AS r ON f.doc_num = r.doc_num AND r.co_art = 'OCTA-ALB'
LEFT JOIN [A_TAO_A].[dbo].[saCliente] AS c ON f.co_cli = c.co_cli
LEFT JOIN [A_TAO_A].[dbo].[saArticulo] AS a ON r.co_art = a.co_art
OUTER APPLY (
    SELECT TOP 1 t.tasa_v
    FROM [A_TAO_A].[dbo].[saTasa] AS t
    WHERE t.co_mone = 'USD'
      AND CAST(t.fecha AS DATE) <= CAST(f.fec_emis AS DATE)
    ORDER BY t.fecha DESC
) AS TasaHist
WHERE f.anulado = 0;
GO

PRINT '  ✓ aaron_view_DetalleVentasDolarizadas';
GO

-- ===================================================================
-- VIEW 2: aaron_view_DetalleComprasDolarizadas
-- Desc: Base leaf view for purchase-derived views.
--       UNION purchases from A_TAO_A where product is OCTA-ALB.
-- ===================================================================
USE [desarrollo]
GO

ALTER VIEW [dbo].[aaron_view_DetalleComprasDolarizadas] AS
SELECT 
    f.doc_num AS [Factura_Compra],
    f.fec_emis AS [Fecha_Emision],
    f.co_prov AS [Codigo_Proveedor],
    p.prov_des AS [Nombre_Proveedor],
    p.tip_pro AS [Tipo_Proveedor],
    p.direc1 AS [Direccion_Fiscal],
    p.fecha_reg AS [Fecha_Registro_Proveedor],
    r.co_art AS [Codigo_Articulo],
    a.ref AS [Ref_Articulo],
    COALESCE(a.art_des, r.des_art) AS [Descripcion_Articulo],
    r.total_art AS [Cantidad],
    r.cost_unit AS [Costo_Unitario_VES],
    r.reng_neto AS [Monto_Renglon_VES],
    TasaHist.tasa_v AS [Tasa_USD_Aplicada],
    CAST(r.cost_unit / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Costo_Unitario_USD],
    CAST(r.reng_neto / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Monto_Renglon_USD],
    f.co_sucu_in AS [Sucursal],
    'compra' as [tipo]
FROM [A_MEDVAL_A].[dbo].[saFacturaCompra] AS f
INNER JOIN [A_MEDVAL_A].[dbo].[saFacturaCompraReng] AS r ON f.doc_num = r.doc_num
LEFT JOIN [A_MEDVAL_A].[dbo].[saProveedor] AS p ON f.co_prov = p.co_prov
LEFT JOIN [A_MEDVAL_A].[dbo].[saArticulo] AS a ON r.co_art = a.co_art
OUTER APPLY (
    SELECT TOP 1 t.tasa_v
    FROM [A_MEDVAL_A].[dbo].[saTasa] AS t
    WHERE t.co_mone = 'USD' 
      AND CAST(t.fecha AS DATE) <= CAST(f.fec_emis AS DATE)
    ORDER BY t.fecha DESC
) AS TasaHist
WHERE f.anulado = 0

UNION ALL

SELECT 
    f.doc_num AS [Factura_Compra],
    f.fec_emis AS [Fecha_Emision],
    f.co_prov AS [Codigo_Proveedor],
    p.prov_des AS [Nombre_Proveedor],
    p.tip_pro AS [Tipo_Proveedor],
    p.direc1 AS [Direccion_Fiscal],
    p.fecha_reg AS [Fecha_Registro_Proveedor],
    r.co_art AS [Codigo_Articulo],
    a.ref AS [Ref_Articulo],
    COALESCE(a.art_des, r.des_art) AS [Descripcion_Articulo],
    r.total_art AS [Cantidad],
    r.cost_unit AS [Costo_Unitario_VES],
    r.reng_neto AS [Monto_Renglon_VES],
    TasaHist.tasa_v AS [Tasa_USD_Aplicada],
    CAST(r.cost_unit / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Costo_Unitario_USD],
    CAST(r.reng_neto / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Monto_Renglon_USD],
    f.co_sucu_in AS [Sucursal],
    'compra' as [tipo]
FROM [A_TAO_A].[dbo].[saFacturaCompra] AS f
INNER JOIN [A_TAO_A].[dbo].[saFacturaCompraReng] AS r ON f.doc_num = r.doc_num AND r.co_art = 'OCTA-ALB'
LEFT JOIN [A_TAO_A].[dbo].[saProveedor] AS p ON f.co_prov = p.co_prov
LEFT JOIN [A_TAO_A].[dbo].[saArticulo] AS a ON r.co_art = a.co_art
OUTER APPLY (
    SELECT TOP 1 t.tasa_v
    FROM [A_TAO_A].[dbo].[saTasa] AS t
    WHERE t.co_mone = 'USD' 
      AND CAST(t.fecha AS DATE) <= CAST(f.fec_emis AS DATE)
    ORDER BY t.fecha DESC
) AS TasaHist
WHERE f.anulado = 0;
GO

PRINT '  ✓ aaron_view_DetalleComprasDolarizadas';
GO

-- ===================================================================
-- VIEW 3: aaron_view_DetalleInventarioAlmacenLoteVencimiento
-- Desc: Leaf view for inventory lot-level data (warehouse, lot, expiry).
--       UNION lots from A_TAO_A where product is OCTA-ALB.
-- ===================================================================
ALTER VIEW [dbo].[aaron_view_DetalleInventarioAlmacenLoteVencimiento]
AS
SELECT 
    a.co_art AS [Codigo_Articulo], 
    a.ref AS [Ref_Articulo],
    a.art_des AS [Nombre_Articulo], 
    alm.co_alma AS [Codigo_Almacen], 
    alm.des_alma AS [Nombre_Almacen],
    le.stock_actual AS [Unidades],
    le.fecha_expiracion AS [Fecha_Vencimiento],
    le.numero_lote AS [Lote]
FROM 
    [A_MEDVAL_A].[dbo].[saArticulo] a
INNER JOIN 
    [A_MEDVAL_A].[dbo].[saLoteEntrada] le ON a.co_art = le.co_art
INNER JOIN 
    [A_MEDVAL_A].[dbo].[saAlmacen] alm ON le.co_alma = alm.co_alma
WHERE 
    a.tipo = 'V'
    AND a.anulado = 0
    AND le.stock_actual > 0

UNION ALL

SELECT 
    a.co_art AS [Codigo_Articulo], 
    a.ref AS [Ref_Articulo],
    a.art_des AS [Nombre_Articulo], 
    alm.co_alma AS [Codigo_Almacen], 
    alm.des_alma AS [Nombre_Almacen],
    le.stock_actual AS [Unidades],
    le.fecha_expiracion AS [Fecha_Vencimiento],
    le.numero_lote AS [Lote]
FROM 
    [A_TAO_A].[dbo].[saArticulo] a
INNER JOIN 
    [A_TAO_A].[dbo].[saLoteEntrada] le ON a.co_art = le.co_art AND le.co_art = 'OCTA-ALB'
INNER JOIN 
    [A_TAO_A].[dbo].[saAlmacen] alm ON le.co_alma = alm.co_alma
WHERE 
    a.tipo = 'V'
    AND a.anulado = 0
    AND le.stock_actual > 0;
GO

PRINT '  ✓ aaron_view_DetalleInventarioAlmacenLoteVencimiento';
GO

-- ===================================================================
-- VIEW 4: aaron_view_DetalleInventarioCompleto
-- Desc: Leaf view for treemap, excludes excluded warehouses.
--       UNION lots from A_TAO_A where product is OCTA-ALB.
-- ===================================================================
ALTER VIEW [dbo].[aaron_view_DetalleInventarioCompleto]
AS
SELECT 
    a.co_art AS [Codigo_Articulo], 
    a.ref AS [Ref_Articulo],
    a.art_des AS [Nombre_Articulo], 
    alm.co_alma AS [Codigo_Almacen], 
    alm.des_alma AS [Nombre_Almacen],
    le.stock_actual AS [Unidades],
    le.fecha_expiracion AS [Fecha_Vencimiento],
    le.numero_lote AS [Lote]
FROM 
    [A_MEDVAL_A].[dbo].[saArticulo] a
INNER JOIN 
    [A_MEDVAL_A].[dbo].[saLoteEntrada] le ON a.co_art = le.co_art
INNER JOIN 
    [A_MEDVAL_A].[dbo].[saAlmacen] alm ON le.co_alma = alm.co_alma
WHERE 
    le.stock_actual > 0
    AND alm.co_alma NOT IN (SELECT Codigo_Almacen FROM aaron_AlmacenesExcluidos)

UNION ALL

SELECT 
    a.co_art AS [Codigo_Articulo], 
    a.ref AS [Ref_Articulo],
    a.art_des AS [Nombre_Articulo], 
    alm.co_alma AS [Codigo_Almacen], 
    alm.des_alma AS [Nombre_Almacen],
    le.stock_actual AS [Unidades],
    le.fecha_expiracion AS [Fecha_Vencimiento],
    le.numero_lote AS [Lote]
FROM 
    [A_TAO_A].[dbo].[saArticulo] a
INNER JOIN 
    [A_TAO_A].[dbo].[saLoteEntrada] le ON a.co_art = le.co_art AND le.co_art = 'OCTA-ALB'
INNER JOIN 
    [A_TAO_A].[dbo].[saAlmacen] alm ON le.co_alma = alm.co_alma
WHERE 
    le.stock_actual > 0;
GO

PRINT '  ✓ aaron_view_DetalleInventarioCompleto';
GO

-- ===================================================================
-- VIEW 5: aaron_view_DetalleInventarioDolarizado (core inventory view)
-- Desc: Stock totals + last sale price + last purchase cost.
--       UNIONs from A_TAO_A for:
--         - saArticulo base
--         - saLoteEntrada aggregation (inventory)
--         - saArtPrecio (last sale price)
--       DetalleComprasDolarizadas (last cost) is already covered by View 2.
-- ===================================================================
ALTER VIEW [dbo].[aaron_view_DetalleInventarioDolarizado] AS
SELECT 
    a.co_art AS [Codigo_Articulo],
    a.ref AS [Ref_Articulo],
    a.art_des AS [Descripcion_Articulo],
    inv.Stock_Total AS [Stock_Total],
    inv.Proximo_Vencimiento AS [Proximo_Vencimiento],
    UltimaVenta.Precio_Unitario_Vendido_USD AS [Ultimo_Precio_Venta_USD],
    UltimaCompra.Costo_Unitario_Comprado_USD AS [Ultimo_Costo_Compra_USD]
FROM 
    (
        SELECT co_art, ref, art_des 
        FROM [A_MEDVAL_A].[dbo].[saArticulo]
        UNION ALL
        SELECT co_art, ref, art_des 
        FROM [A_TAO_A].[dbo].[saArticulo] 
        WHERE co_art = 'OCTA-ALB'
    ) a

-- 1. TOTAL INVENTORY AND NEAREST EXPIRATION (UNION lots from both DBs)
INNER JOIN (
    SELECT 
        co_art, 
        SUM(stock_actual) AS Stock_Total, 
        MIN(fecha_expiracion) AS Proximo_Vencimiento
    FROM (
        SELECT co_art, stock_actual, fecha_expiracion
        FROM [A_MEDVAL_A].[dbo].[saLoteEntrada]
        WHERE stock_actual > 0
        UNION ALL
        SELECT co_art, stock_actual, fecha_expiracion
        FROM [A_TAO_A].[dbo].[saLoteEntrada]
        WHERE stock_actual > 0 AND co_art = 'OCTA-ALB'
    ) lots
    GROUP BY co_art
) inv ON a.co_art = inv.co_art

-- 2. LAST SELLING PRICE IN USD (UNION pricing from both DBs)
OUTER APPLY (
    SELECT TOP 1 
        p.monto AS Precio_Unitario_Vendido_USD
    FROM (
        SELECT co_art, monto, co_precio, Inactivo, desde, hasta
        FROM [A_MEDVAL_A].[dbo].[saArtPrecio]
        WHERE co_precio = '01' AND Inactivo = 0 AND (hasta IS NULL OR hasta >= GETDATE())
        UNION ALL
        SELECT co_art, monto, co_precio, Inactivo, desde, hasta
        FROM [A_TAO_A].[dbo].[saArtPrecio]
        WHERE co_art = 'OCTA-ALB' AND co_precio = '01' AND Inactivo = 0 AND (hasta IS NULL OR hasta >= GETDATE())
    ) p
    WHERE p.co_art = a.co_art
    ORDER BY p.desde DESC
) UltimaVenta

-- 3. LAST PURCHASE COST IN USD (feeds from View 2 which already includes A_TAO_A)
OUTER APPLY (
    SELECT TOP 1 
        c.Costo_Unitario_USD AS Costo_Unitario_Comprado_USD
    FROM 
        [desarrollo].[dbo].[aaron_view_DetalleComprasDolarizadas] c
    WHERE 
        c.Codigo_Articulo = a.co_art
    ORDER BY 
        c.Fecha_Emision DESC
) UltimaCompra;
GO

PRINT '  ✓ aaron_view_DetalleInventarioDolarizado';
GO

-- ===================================================================
-- VIEW 6: aaron_view_CuentasPorCobrarDolarizadas (Accounts Receivable)
-- Desc: AR documents. UNIONs from A_TAO_A for invoices containing OCTA-ALB.
-- ===================================================================
ALTER VIEW [dbo].[aaron_view_CuentasPorCobrarDolarizadas] AS
SELECT 
    d.nro_doc AS [Numero_Documento],
    d.co_tipo_doc AS [Tipo_Documento],
    d.fec_emis AS [Fecha_Emision],
    d.fec_venc AS [Fecha_Vencimiento],
    d.co_cli AS [Codigo_Cliente],
    c.cli_des AS [Nombre_Cliente],
    c.tip_cli AS [Tipo_Cliente],
    c.direc1 AS [Direccion_Fiscal],
    d.total_neto AS [Monto_Original_VES],
    d.saldo AS [Saldo_Pendiente_VES],
    TasaHist.tasa_v AS [Tasa_USD_Aplicada],
    CAST(d.total_neto / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Monto_Original_USD],
    CAST(d.saldo / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Saldo_Pendiente_USD],
    DATEDIFF(DAY, d.fec_venc, GETDATE()) AS [Dias_Vencidos],
    d.co_ven AS [Vendedor],
    d.co_sucu_in AS [Sucursal]
FROM [A_MEDVAL_A].[dbo].[saDocumentoVenta] AS d
LEFT JOIN [A_MEDVAL_A].[dbo].[saCliente] AS c ON d.co_cli = c.co_cli
OUTER APPLY (
    SELECT TOP 1 t.tasa_v
    FROM [A_MEDVAL_A].[dbo].[saTasa] AS t
    WHERE t.co_mone = 'USD' 
      AND CAST(t.fecha AS DATE) <= CAST(d.fec_emis AS DATE)
    ORDER BY t.fecha DESC
) AS TasaHist
WHERE d.anulado = 0 AND d.saldo > 0

UNION ALL

SELECT 
    d.nro_doc AS [Numero_Documento],
    d.co_tipo_doc AS [Tipo_Documento],
    d.fec_emis AS [Fecha_Emision],
    d.fec_venc AS [Fecha_Vencimiento],
    d.co_cli AS [Codigo_Cliente],
    c.cli_des AS [Nombre_Cliente],
    c.tip_cli AS [Tipo_Cliente],
    c.direc1 AS [Direccion_Fiscal],
    d.total_neto AS [Monto_Original_VES],
    d.saldo AS [Saldo_Pendiente_VES],
    TasaHist.tasa_v AS [Tasa_USD_Aplicada],
    CAST(d.total_neto / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Monto_Original_USD],
    CAST(d.saldo / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Saldo_Pendiente_USD],
    DATEDIFF(DAY, d.fec_venc, GETDATE()) AS [Dias_Vencidos],
    d.co_ven AS [Vendedor],
    d.co_sucu_in AS [Sucursal]
FROM [A_TAO_A].[dbo].[saDocumentoVenta] AS d
LEFT JOIN [A_TAO_A].[dbo].[saCliente] AS c ON d.co_cli = c.co_cli
OUTER APPLY (
    SELECT TOP 1 t.tasa_v
    FROM [A_TAO_A].[dbo].[saTasa] AS t
    WHERE t.co_mone = 'USD' 
      AND CAST(t.fecha AS DATE) <= CAST(d.fec_emis AS DATE)
    ORDER BY t.fecha DESC
) AS TasaHist
WHERE d.anulado = 0 AND d.saldo > 0
  AND EXISTS (
    SELECT 1 
    FROM [A_TAO_A].[dbo].[saFacturaVentaReng] r
    INNER JOIN [A_TAO_A].[dbo].[saFacturaVenta] f ON r.doc_num = f.doc_num
    WHERE f.doc_num = d.nro_doc AND r.co_art = 'OCTA-ALB'
  );
GO

PRINT '  ✓ aaron_view_CuentasPorCobrarDolarizadas';
GO

-- ===================================================================
-- SUMMARY
-- ===================================================================
PRINT '';
PRINT '========================================';
PRINT '  Migration complete!';
PRINT '========================================';
PRINT '';
PRINT 'Views directly modified (6):';
PRINT '  1. aaron_view_DetalleVentasDolarizadas';
PRINT '  2. aaron_view_DetalleComprasDolarizadas';
PRINT '  3. aaron_view_DetalleInventarioAlmacenLoteVencimiento';
PRINT '  4. aaron_view_DetalleInventarioCompleto';
PRINT '  5. aaron_view_DetalleInventarioDolarizado';
PRINT '  6. aaron_view_CuentasPorCobrarDolarizadas';
PRINT '';
PRINT 'Derived views that auto-propagate (20+):';
PRINT '  - All sales: Producto, ProductoAnual, ProductoMensual,';
PRINT '    ProductoTipo, TipoMensual, ProductoCliente,';
PRINT '    ProductoClienteAnual, ProductClienteMensual, Cliente,';
PRINT '    ClienteAnual, ClienteMensual, ClienteProduct,';
PRINT '    ClienteProductoAnual, ClienteProductoMensual,';
PRINT '    PromedioVentasUltimoAnio';
PRINT '  - All inventory: TotalInventarioDolarizado,';
PRINT '    AnalisisReposicionInventario, AnalisisReposicionCritico,';
PRINT '    AnalisisReposicionStockBajo, AnalisisReposicionActivo,';
PRINT '    RelacionInventarioTotal,';
PRINT '    DetalleInventarioAlmacenLoteVencimientoDolarizado,';
PRINT '    DetalleInventarioCompletoDolarizado, InventarioPorProducto,';
PRINT '    InventarioPorVencimiento';
PRINT '  - AR: CuentasPorCobrarDolarizadasCliente,';
PRINT '    CuentasPorCobrarDolarizadasAnio,';
PRINT '    CuentasPorCobrarAgrupadoClienteAnio';
PRINT '';
PRINT 'Strategy: Each leaf view UNIONs data from A_TAO_A';
PRINT '          filtered by co_art = ''OCTA-ALB''.';
PRINT 'Frontend changes: NONE required.';
PRINT '========================================';
GO
