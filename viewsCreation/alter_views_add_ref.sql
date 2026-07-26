-- ===================================================================
-- Script: alter_views_add_ref.sql
-- Purpose: Add Ref_Articulo to all derived views that query from
--          views which already have Ref_Articulo.
-- Run in: SQL Server Management Studio
-- ===================================================================

-- ===================================================================
-- GROUP 1: Views that SELECT from aaron_view_DetalleInventarioDolarizado
-- ===================================================================

-- 1/20 NotificationsPanel, KPI Row
ALTER VIEW [dbo].[aaron_view_AnalisisReposicionInventario] AS
SELECT 
    inv.Codigo_Articulo,
    inv.Ref_Articulo,
    inv.Descripcion_Articulo,
    inv.Stock_Total,
    inv.Proximo_Vencimiento,
    CASE 
        WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN 'VENCIDO'
        WHEN DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) <= 30 THEN 'CRITICO'
        ELSE 'VIGENTE'
    END AS [Estado_Stock],
    ISNULL(prom.Promedio_Mensual_Unidades, 0) AS [Venta_Promedio_Mensual_Actual],
    CAST(
        CASE 
            WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN 0 
            ELSE inv.Stock_Total / NULLIF(prom.Promedio_Mensual_Unidades, 0) 
        END 
    AS DECIMAL(18,2)) AS [Meses_De_Inventario_Restante],
    CAST(
        CASE 
            WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN inv.Stock_Total 
            WHEN DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) <= 30 THEN inv.Stock_Total 
            ELSE inv.Stock_Total / (DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) / 30.0)
        END
    AS DECIMAL(18,2)) AS [Meta_Venta_Mensual_Para_No_Perder],
    inv.Ultimo_Precio_Venta_USD,
    inv.Ultimo_Costo_Compra_USD
FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioDolarizado] AS inv
LEFT JOIN 
    [desarrollo].[dbo].[aaron_view_PromedioVentasUltimoAnio] AS prom 
    ON inv.Codigo_Articulo = prom.Codigo_Articulo
GO

-- 2/20 StockDetailModal — activo filter
ALTER VIEW [dbo].[aaron_view_AnalisisReposicionActivo] AS
SELECT 
    inv.Codigo_Articulo,
    inv.Ref_Articulo,
    inv.Descripcion_Articulo,
    inv.Stock_Total,
    inv.Proximo_Vencimiento,
    CASE 
        WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN 'VENCIDO'
        WHEN DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) <= 30 THEN 'CRITICO'
        ELSE 'VIGENTE'
    END AS [Estado_Stock],
    ISNULL(prom.Promedio_Mensual_Unidades, 0) AS [Venta_Promedio_Mensual_Actual],
    CAST(
        CASE 
            WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN 0 
            ELSE inv.Stock_Total / NULLIF(prom.Promedio_Mensual_Unidades, 0) 
        END 
    AS DECIMAL(18,2)) AS [Meses_De_Inventario_Restante],
    CAST(
        CASE 
            WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN inv.Stock_Total 
            WHEN DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) <= 30 THEN inv.Stock_Total 
            ELSE inv.Stock_Total / (DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) / 30.0)
        END
    AS DECIMAL(18,2)) AS [Meta_Venta_Mensual_Para_No_Perder],
    inv.Ultimo_Precio_Venta_USD,
    inv.Ultimo_Costo_Compra_USD
FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioDolarizado] AS inv
LEFT JOIN 
    [desarrollo].[dbo].[aaron_view_PromedioVentasUltimoAnio] AS prom 
    ON inv.Codigo_Articulo = prom.Codigo_Articulo
WHERE 
    inv.Proximo_Vencimiento >= CAST(GETDATE() AS DATE)
GO

-- 3/20 StockDetailModal — bajo filter
ALTER VIEW [dbo].[aaron_view_AnalisisReposicionStockBajo] AS
SELECT 
    inv.Codigo_Articulo,
    inv.Ref_Articulo,
    inv.Descripcion_Articulo,
    inv.Stock_Total,
    inv.Proximo_Vencimiento,
    CASE 
        WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN 'VENCIDO'
        WHEN DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) <= 30 THEN 'CRITICO'
        ELSE 'VIGENTE'
    END AS [Estado_Stock],
    ISNULL(prom.Promedio_Mensual_Unidades, 0) AS [Venta_Promedio_Mensual_Actual],
    CAST(
        CASE 
            WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN 0 
            ELSE inv.Stock_Total / NULLIF(prom.Promedio_Mensual_Unidades, 0) 
        END 
    AS DECIMAL(18,2)) AS [Meses_De_Inventario_Restante],
    CAST(
        CASE 
            WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN inv.Stock_Total 
            WHEN DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) <= 30 THEN inv.Stock_Total 
            ELSE inv.Stock_Total / (DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) / 30.0)
        END
    AS DECIMAL(18,2)) AS [Meta_Venta_Mensual_Para_No_Perder],
    inv.Ultimo_Precio_Venta_USD,
    inv.Ultimo_Costo_Compra_USD
FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioDolarizado] AS inv
LEFT JOIN 
    [desarrollo].[dbo].[aaron_view_PromedioVentasUltimoAnio] AS prom 
    ON inv.Codigo_Articulo = prom.Codigo_Articulo
WHERE 
    inv.Proximo_Vencimiento >= CAST(GETDATE() AS DATE)
    AND inv.Stock_Total / NULLIF(prom.Promedio_Mensual_Unidades, 0) <= 3
    AND ISNULL(prom.Promedio_Mensual_Unidades, 0) > 0
GO

-- 4/20 StockDetailModal — critico filter
ALTER VIEW [dbo].[aaron_view_AnalisisReposicionCritico] AS
SELECT 
    inv.Codigo_Articulo,
    inv.Ref_Articulo,
    inv.Descripcion_Articulo,
    inv.Stock_Total,
    inv.Proximo_Vencimiento,
    'CRITICO' AS [Estado_Stock],
    ISNULL(prom.Promedio_Mensual_Unidades, 0) AS [Venta_Promedio_Mensual_Actual],
    CAST(
        CASE 
            WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN 0 
            ELSE inv.Stock_Total / NULLIF(prom.Promedio_Mensual_Unidades, 0) 
        END 
    AS DECIMAL(18,2)) AS [Meses_De_Inventario_Restante],
    CAST(inv.Stock_Total AS DECIMAL(18,2)) AS [Meta_Venta_Mensual_Para_No_Perder],
    inv.Ultimo_Precio_Venta_USD,
    inv.Ultimo_Costo_Compra_USD
FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioDolarizado] AS inv
LEFT JOIN 
    [desarrollo].[dbo].[aaron_view_PromedioVentasUltimoAnio] AS prom 
    ON inv.Codigo_Articulo = prom.Codigo_Articulo
WHERE 
    inv.Proximo_Vencimiento >= CAST(GETDATE() AS DATE)
    AND DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) <= 30
GO

-- 5/20 Treemap — participation ratios
ALTER VIEW [dbo].[aaron_view_RelacionInventarioTotal] AS
SELECT 
    d.Codigo_Articulo,
    d.Ref_Articulo,
    d.Descripcion_Articulo,
    d.Stock_Total,
    CAST((d.Stock_Total * ISNULL(d.Ultimo_Costo_Compra_USD, 0)) AS DECIMAL(18,2)) AS [Valor_Total_Item_Costo_USD],
    CAST((d.Stock_Total * ISNULL(d.Ultimo_Precio_Venta_USD, 0)) AS DECIMAL(18,2)) AS [Valor_Total_Item_Venta_USD],
    CAST(
        ((d.Stock_Total * ISNULL(d.Ultimo_Costo_Compra_USD, 0)) / NULLIF(r.Valor_Total_Costo_USD, 0)) * 100 
    AS DECIMAL(18,2)) AS [Porc_Participacion_Costo],
    CAST(
        ((d.Stock_Total * ISNULL(d.Ultimo_Precio_Venta_USD, 0)) / NULLIF(r.Valor_Total_Venta_USD, 0)) * 100 
    AS DECIMAL(18,2)) AS [Porc_Participacion_Venta]
FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioDolarizado] d
CROSS JOIN 
    [desarrollo].[dbo].[aaron_view_TotalInventarioDolarizado] r
WHERE 
    d.Stock_Total > 0
GO

-- ===================================================================
-- GROUP 2: Views that SELECT from aaron_view_DetalleInventarioAlmacenLoteVencimiento
-- ===================================================================

-- 6/20 InventarioMainList — lot-level inventory with prices
ALTER VIEW [dbo].[aaron_view_DetalleInventarioAlmacenLoteVencimientoDolarizado]
AS
SELECT 
    v1.Codigo_Articulo, 
    v1.Ref_Articulo,
    v1.Nombre_Articulo, 
    v1.Codigo_Almacen, 
    v1.Nombre_Almacen,
    v1.Unidades,
    v1.Fecha_Vencimiento,
    v1.Lote,
    v2.Ultimo_Precio_Venta_USD,
    v2.Ultimo_Costo_Compra_USD,
    CAST(v1.Unidades * v2.Ultimo_Costo_Compra_USD AS DECIMAL(18,2)) AS Total_Ultimo_Costo_Compra_USD,
    CAST(v1.Unidades * v2.Ultimo_Precio_Venta_USD AS DECIMAL(18,2)) AS Total_Ultimo_Precio_Venta_USD
FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioAlmacenLoteVencimiento] v1
INNER JOIN 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioDolarizado] v2 ON v1.Codigo_Articulo = v2.Codigo_Articulo
GO

-- ===================================================================
-- GROUP 3: Views that SELECT from aaron_view_DetalleInventarioAlmacenLoteVencimientoDolarizado
-- ===================================================================

-- 7/20 InventarioPorProductoPage
ALTER VIEW [dbo].[aaron_view_InventarioPorProducto]
AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Nombre_Articulo,
    COUNT(DISTINCT Codigo_Almacen) AS Almacenes_Distintos,
    SUM(Unidades) AS Total_Unidades,
    MIN(Fecha_Vencimiento) AS Proximo_Vencimiento,
    CAST(SUM(Total_Ultimo_Precio_Venta_USD) AS DECIMAL(18,2)) AS Total_Valor_Venta_USD,
    CAST(SUM(Total_Ultimo_Costo_Compra_USD) AS DECIMAL(18,2)) AS Total_Valor_Costo_USD
FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioAlmacenLoteVencimientoDolarizado]
GROUP BY 
    Codigo_Articulo,
    Ref_Articulo,
    Nombre_Articulo
GO

-- ===================================================================
-- GROUP 4: Views that SELECT from aaron_view_DetalleInventarioCompleto
-- ===================================================================

-- 8/20 InventarioTreemap
ALTER VIEW [dbo].[aaron_view_DetalleInventarioCompletoDolarizado]
AS
SELECT 
    v1.Codigo_Articulo, 
    v1.Ref_Articulo,
    v1.Nombre_Articulo, 
    v1.Codigo_Almacen, 
    v1.Nombre_Almacen,
    v1.Unidades,
    v1.Fecha_Vencimiento,
    v1.Lote,
    v2.Ultimo_Precio_Venta_USD,
    v2.Ultimo_Costo_Compra_USD,
    CAST(v1.Unidades * v2.Ultimo_Costo_Compra_USD AS DECIMAL(18,2)) AS Total_Ultimo_Costo_Compra_USD,
    CAST(v1.Unidades * v2.Ultimo_Precio_Venta_USD AS DECIMAL(18,2)) AS Total_Ultimo_Precio_Venta_USD
FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioCompleto] v1
INNER JOIN 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioDolarizado] v2 ON v1.Codigo_Articulo = v2.Codigo_Articulo
GO

-- ===================================================================
-- GROUP 5: Views that SELECT from aaron_view_DetalleVentasDolarizadas (product-level)
-- ===================================================================

-- 9/20 VentasProductoPage — product-level sales totals
ALTER VIEW [dbo].[aaron_view_DetalleVentasDolarizadasProducto] AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo,
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Articulo, Ref_Articulo, Descripcion_Articulo
GO

-- 10/20 VentasProductoPage — product-monthly sales
ALTER VIEW [dbo].[aaron_view_DetalleVentasDolarizadasProductoMensual] AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo,
    YEAR(Fecha_Emision) AS [Anio],
    MONTH(Fecha_Emision) AS [Mes],
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, YEAR(Fecha_Emision), MONTH(Fecha_Emision)
GO

-- 11/20 VentasProductoPage — product-annual sales
ALTER VIEW [dbo].[aaron_view_DetalleVentasDolarizadasProductoAnual] AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo,
    YEAR(Fecha_Emision) AS [Anio],
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, YEAR(Fecha_Emision)
GO

-- 12/20 Feeds all AnalisisReposicion* views
ALTER VIEW [dbo].[aaron_view_PromedioVentasUltimoAnio] AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo,
    SUM(Cantidad) AS [Total_Unidades_Ultimo_Anio],
    CAST(SUM(Monto_Renglon_USD) AS DECIMAL(18,2)) AS [Total_USD_Ultimo_Anio],
    COUNT(DISTINCT Factura) AS [Total_Facturas_Ultimo_Anio],
    CAST((SUM(Cantidad) / 12.0) AS DECIMAL(18,2)) AS [Promedio_Mensual_Unidades],
    CAST((SUM(Monto_Renglon_USD) / 12.0) AS DECIMAL(18,2)) AS [Promedio_Mensual_USD]
FROM 
    [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
WHERE 
    Fecha_Emision >= DATEADD(YEAR, -1, GETDATE())
    AND Fecha_Emision <= GETDATE()
GROUP BY 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo
GO

-- 13/20 Ventas — product-client totals
ALTER VIEW [dbo].[aaron_view_DetalleVentasDolarizadasClienteProduct] AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo,
    Codigo_Cliente,
    Nombre_Cliente,
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, Codigo_Cliente, Nombre_Cliente
GO

-- 14/20 Ventas — product-client-annual totals
ALTER VIEW [dbo].[aaron_view_DetalleVentasDolarizadasClienteProductoAnual] AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo,
    Codigo_Cliente,
    Nombre_Cliente,
    YEAR(Fecha_Emision) AS [Anio],
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, Codigo_Cliente, Nombre_Cliente, YEAR(Fecha_Emision)
GO

-- 15/20 Ventas — product-client-monthly totals
ALTER VIEW [dbo].[aaron_view_DetalleVentasDolarizadasClienteProductoMensual] AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo,
    Codigo_Cliente,
    Nombre_Cliente,
    YEAR(Fecha_Emision) AS [Anio],
    MONTH(Fecha_Emision) AS [Mes],
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, Codigo_Cliente, Nombre_Cliente, YEAR(Fecha_Emision), MONTH(Fecha_Emision)
GO

-- 16/20 Ventas — product-client-monthly (grouped by product first)
ALTER VIEW [dbo].[aaron_view_DetalleVentasDolarizadasProductClienteMensual] AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo,
    Codigo_Cliente,
    Nombre_Cliente,
    YEAR(Fecha_Emision) AS [Anio],
    MONTH(Fecha_Emision) AS [Mes],
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, Codigo_Cliente, Nombre_Cliente, YEAR(Fecha_Emision), MONTH(Fecha_Emision)
GO

-- 17/20 Ventas — product-client totals (grouped by product first)
ALTER VIEW [dbo].[aaron_view_DetalleVentasDolarizadasProductoCliente] AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo,
    Codigo_Cliente,
    Nombre_Cliente,
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, Codigo_Cliente, Nombre_Cliente
GO

-- 18/20 Ventas — product-client-annual (grouped by product first)
ALTER VIEW [dbo].[aaron_view_DetalleVentasDolarizadasProductoClienteAnual] AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo,
    Codigo_Cliente,
    Nombre_Cliente,
    YEAR(Fecha_Emision) AS [Anio],
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, Codigo_Cliente, Nombre_Cliente, YEAR(Fecha_Emision)
GO

-- 19/20 Ventas — product-type totals
ALTER VIEW [dbo].[aaron_view_DetalleVentasDolarizadasProductoTipo] AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo,
    tipo,
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, tipo
GO

-- 20/20 Ventas — product-type-monthly
ALTER VIEW [dbo].[aaron_view_DetalleVentasDolarizadasTipoMensual] AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo,
    tipo,
    YEAR(Fecha_Emision) AS [Anio],
    MONTH(Fecha_Emision) AS [Mes],
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, tipo, YEAR(Fecha_Emision), MONTH(Fecha_Emision)
GO

PRINT 'All 20 views successfully altered with Ref_Articulo.'
GO
