USE [desarrollo]
GO

/****** Object:  View [dbo].[aaron_view_PromedioVentasUltimoAnio] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[aaron_view_PromedioVentasUltimoAnio] AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo,
    
    -- Totals for the trailing 365 days
    SUM(Cantidad) AS [Total_Unidades_Ultimo_Anio],
    CAST(SUM(Monto_Renglon_USD) AS DECIMAL(18,2)) AS [Total_USD_Ultimo_Anio],
    COUNT(DISTINCT Factura) AS [Total_Facturas_Ultimo_Anio],

    -- True Monthly Averages over the trailing 365 days
    -- We divide by 12.0 to force decimal math, preventing rounding errors
    CAST((SUM(Cantidad) / 12.0) AS DECIMAL(18,2)) AS [Promedio_Mensual_Unidades],
    CAST((SUM(Monto_Renglon_USD) / 12.0) AS DECIMAL(18,2)) AS [Promedio_Mensual_USD]

FROM 
    [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]

WHERE 
    -- This acts as your dynamic cap. It dynamically grabs today's date/time
    -- and steps back exactly 1 year. Every time you query the view, this moves forward.
    Fecha_Emision >= DATEADD(YEAR, -1, GETDATE())
    AND Fecha_Emision <= GETDATE() -- Safety check against accidental future-dated invoices

GROUP BY 
    Codigo_Articulo,
    Ref_Articulo,
    Descripcion_Articulo
GO