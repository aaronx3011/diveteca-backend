USE [desarrollo]
GO

CREATE VIEW [dbo].[aaron_view_VentasDolarizadasClienteMensual] AS
SELECT 
    Codigo_Cliente,
    Nombre_Cliente,
    YEAR(Fecha_Emision) AS [Anio],
    MONTH(Fecha_Emision) AS [Mes],
    SUM(Cantidad) AS [Unidades_Mes],
    SUM(Monto_Renglon_USD) AS [Total_USD_Mes],
    COUNT(DISTINCT Factura) AS [Cant_Facturas_Mes]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Cliente, Nombre_Cliente, YEAR(Fecha_Emision), MONTH(Fecha_Emision);
GO