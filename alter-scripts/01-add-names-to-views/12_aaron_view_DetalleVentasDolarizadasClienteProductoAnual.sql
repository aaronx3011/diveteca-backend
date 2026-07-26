USE [desarrollo]
GO

ALTER VIEW [dbo].[aaron_view_DetalleVentasDolarizadasClienteProductoAnual] AS
SELECT 
    Codigo_Articulo,
    Descripcion_Articulo,
    Codigo_Cliente,
    Nombre_Cliente,
    YEAR(Fecha_Emision) AS [Anio],
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Cliente, Nombre_Cliente, Codigo_Articulo, Descripcion_Articulo, YEAR(Fecha_Emision);
GO
