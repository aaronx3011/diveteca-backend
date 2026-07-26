USE [desarrollo]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
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
