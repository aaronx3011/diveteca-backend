USE [desarrollo]
GO

CREATE VIEW [dbo].[aaron_view_ventasDolarizadasClienteAnual] AS
SELECT 
    Codigo_Cliente,
    Nombre_Cliente,
    YEAR(Fecha_Emision) AS [Anio],
    SUM(Cantidad) AS [Unidades_Anio],
    SUM(Monto_Renglon_USD) AS [Total_USD_Anio],
    COUNT(DISTINCT Factura) AS [Cant_Facturas_Anio]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Cliente, Nombre_Cliente, YEAR(Fecha_Emision);
GO