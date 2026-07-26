USE [desarrollo]
GO

CREATE VIEW [dbo].[aaron_view_DetalleVentasDolarizadasClienteMensual] AS
SELECT 
    Codigo_Cliente,
    Nombre_Cliente,
    YEAR(Fecha_Emision) AS [Anio],
    MONTH(Fecha_Emision) AS [Mes],
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Cliente, Nombre_Cliente, YEAR(Fecha_Emision), MONTH(Fecha_Emision);
GO