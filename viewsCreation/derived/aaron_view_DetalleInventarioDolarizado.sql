USE [desarrollo]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER VIEW [dbo].[aaron_view_DetalleInventarioDolarizado] AS
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
