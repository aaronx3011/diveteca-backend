-- ===================================================================
-- Script: rollback-06-add-product-octa-alb.sql
-- Purpose: Rollback the OCTA-ALB migration by restoring views to
--          their original definitions (pre-migration state).
-- Run this if the migration causes issues.
-- ===================================================================

PRINT '========================================';
PRINT 'Rollback: Remove product OCTA-ALB from A_TAO_A';
PRINT '========================================';
GO

-- ===================================================================
-- VIEW 1: aaron_view_DetalleVentasDolarizadas
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
    ISNULL(a.art_des, r.des_art) AS [Descripcion_Articulo],
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
WHERE f.anulado = 0;
GO

PRINT '  âœ“ aaron_view_DetalleVentasDolarizadas restored';
GO

-- ===================================================================
-- VIEW 2: aaron_view_DetalleComprasDolarizadas
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
    r.des_art AS [Descripcion_Articulo],
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
WHERE f.anulado = 0;
GO

PRINT '  âœ“ aaron_view_DetalleComprasDolarizadas restored';
GO

-- ===================================================================
-- VIEW 3: aaron_view_DetalleInventarioAlmacenLoteVencimiento
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
    AND le.stock_actual > 0;
GO

PRINT '  âœ“ aaron_view_DetalleInventarioAlmacenLoteVencimiento restored';
GO

-- ===================================================================
-- VIEW 4: aaron_view_DetalleInventarioCompleto
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
    AND alm.co_alma NOT IN (SELECT Codigo_Almacen FROM aaron_AlmacenesExcluidos);
GO

PRINT '  âœ“ aaron_view_DetalleInventarioCompleto restored';
GO

-- ===================================================================
-- VIEW 5: aaron_view_DetalleInventarioDolarizado
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
    [A_MEDVAL_A].[dbo].[saArticulo] a

INNER JOIN (
    SELECT 
        co_art, 
        SUM(stock_actual) AS Stock_Total, 
        MIN(fecha_expiracion) AS Proximo_Vencimiento
    FROM 
        [A_MEDVAL_A].[dbo].[saLoteEntrada]
    WHERE 
        stock_actual > 0
    GROUP BY 
        co_art
) inv ON a.co_art = inv.co_art

OUTER APPLY (
    SELECT TOP 1 
        p.monto AS Precio_Unitario_Vendido_USD
    FROM 
        [A_MEDVAL_A].[dbo].[saArtPrecio] p
    WHERE 
        p.co_art = a.co_art
        AND p.co_precio = '01'
        AND p.Inactivo = 0
        AND (p.hasta IS NULL OR p.hasta >= GETDATE())
    ORDER BY 
        p.desde DESC
) UltimaVenta

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

PRINT '  âœ“ aaron_view_DetalleInventarioDolarizado restored';
GO

-- ===================================================================
-- VIEW 6: aaron_view_CuentasPorCobrarDolarizadas
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
WHERE d.anulado = 0 AND d.saldo > 0;
GO

PRINT '  âœ“ aaron_view_CuentasPorCobrarDolarizadas restored';
GO

-- ===================================================================
PRINT '';
PRINT '========================================';
PRINT '  Rollback complete!';
PRINT '========================================';
PRINT '';
PRINT 'All 6 views restored to pre-migration state.';
PRINT 'Product OCTA-ALB from A_TAO_A removed from all views.';
PRINT '========================================';
GO
