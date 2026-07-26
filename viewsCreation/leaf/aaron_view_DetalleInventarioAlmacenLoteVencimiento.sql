USE [desarrollo]
GO

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
