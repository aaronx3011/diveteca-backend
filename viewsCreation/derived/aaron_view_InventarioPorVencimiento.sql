USE [desarrollo]
GO

CREATE VIEW [dbo].[aaron_view_InventarioPorVencimiento]
AS
SELECT 
    YEAR(Fecha_Vencimiento) AS Anio,
    MONTH(Fecha_Vencimiento) AS Mes,
    COUNT(DISTINCT Codigo_Articulo) AS Productos_Distintos,
    SUM(Unidades) AS Total_Unidades,
    CAST(SUM(Total_Ultimo_Precio_Venta_USD) AS DECIMAL(18,2)) AS Total_Valor_Venta_USD,
    CAST(SUM(Total_Ultimo_Costo_Compra_USD) AS DECIMAL(18,2)) AS Total_Valor_Costo_USD
FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioAlmacenLoteVencimientoDolarizado]
WHERE 
    Fecha_Vencimiento IS NOT NULL
GROUP BY 
    YEAR(Fecha_Vencimiento),
    MONTH(Fecha_Vencimiento)
GO
