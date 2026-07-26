USE [desarrollo]
GO

CREATE VIEW [dbo].[aaron_view_DetalleVentasDolarizadasProductoAnual] AS
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
GROUP BY Codigo_Articulo, Ref_Articulo, Descripcion_Articulo, YEAR(Fecha_Emision);
GO