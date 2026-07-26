USE [Desarrollo]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
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
