USE [desarrollo]
GO

ALTER VIEW [dbo].[aaron_view_DetalleVentasDolarizadasProductoTipo] AS
SELECT 
    Codigo_Articulo,
    Descripcion_Articulo,
    tipo,
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Articulo, Descripcion_Articulo, tipo;
GO
