USE [desarrollo]
GO

/****** Object:  View [dbo].[aaron_view_ResumenInventarioValorizado] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[aaron_view_TotalInventarioDolarizado] AS
SELECT 
    COUNT(Codigo_Articulo) AS [Total_Items_Distintos],
    SUM(Stock_Total) AS [Total_Unidades_Fisicas],
    
    -- Total Warehouse Value (Cost)
    CAST(SUM(Stock_Total * ISNULL(Ultimo_Costo_Compra_USD, 0)) AS DECIMAL(18,2)) AS [Valor_Total_Costo_USD],
    
    -- Total Potential Warehouse Value (Sales Price)
    CAST(SUM(Stock_Total * ISNULL(Ultimo_Precio_Venta_USD, 0)) AS DECIMAL(18,2)) AS [Valor_Total_Venta_USD],
    
    -- Projected Profit (Sales Value - Cost Value)
    CAST(
        SUM(Stock_Total * ISNULL(Ultimo_Precio_Venta_USD, 0)) - 
        SUM(Stock_Total * ISNULL(Ultimo_Costo_Compra_USD, 0)) 
    AS DECIMAL(18,2)) AS [Ganancia_Proyectada_USD]

FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioDolarizado]
WHERE 
    Stock_Total > 0;
GO