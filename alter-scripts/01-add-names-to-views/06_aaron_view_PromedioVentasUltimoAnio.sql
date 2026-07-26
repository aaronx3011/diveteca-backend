USE [desarrollo]
GO

ALTER VIEW [dbo].[aaron_view_PromedioVentasUltimoAnio] AS
SELECT 
    Codigo_Articulo,
    Descripcion_Articulo,
    
    -- Totals for the trailing 365 days
    SUM(Cantidad) AS [Total_Unidades_Ultimo_Anio],
    CAST(SUM(Monto_Renglon_USD) AS DECIMAL(18,2)) AS [Total_USD_Ultimo_Anio],
    COUNT(DISTINCT Factura) AS [Total_Facturas_Ultimo_Anio],

    -- True Monthly Averages over the trailing 365 days
    CAST((SUM(Cantidad) / 12.0) AS DECIMAL(18,2)) AS [Promedio_Mensual_Unidades],
    CAST((SUM(Monto_Renglon_USD) / 12.0) AS DECIMAL(18,2)) AS [Promedio_Mensual_USD]

FROM 
    [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]

WHERE 
    Fecha_Emision >= DATEADD(YEAR, -1, GETDATE())
    AND Fecha_Emision <= GETDATE()

GROUP BY 
    Codigo_Articulo,
    Descripcion_Articulo
GO
