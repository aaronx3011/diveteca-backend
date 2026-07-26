USE [desarrollo]
GO

CREATE VIEW [dbo].[aaron_view_ventasDolarizadasCliente] AS
SELECT 
    Codigo_Cliente,
    Nombre_Cliente,
    Tipo_Cliente,
    SUM(Cantidad) AS [Total_Unidades_Compradas],
    SUM(Monto_Renglon_VES) AS [Total_Gastado_VES],
    SUM(Monto_Renglon_USD) AS [Total_Gastado_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas_Emitidas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY Codigo_Cliente, Nombre_Cliente, Tipo_Cliente;
GO