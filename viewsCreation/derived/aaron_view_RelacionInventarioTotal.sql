USE [desarrollo]
GO

/****** Object:  View [dbo].[aaron_view_ParticipacionInventario] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[aaron_view_RelacionInventarioTotal] AS
SELECT 
    d.Codigo_Articulo,
    d.Ref_Articulo,
    d.Descripcion_Articulo,
    d.Stock_Total,
    
    -- 1. Individual Item Values
    CAST((d.Stock_Total * ISNULL(d.Ultimo_Costo_Compra_USD, 0)) AS DECIMAL(18,2)) AS [Valor_Total_Item_Costo_USD],
    CAST((d.Stock_Total * ISNULL(d.Ultimo_Precio_Venta_USD, 0)) AS DECIMAL(18,2)) AS [Valor_Total_Item_Venta_USD],

    -- 2. Ratios / Participation Percentages (Item Value / Total Warehouse Value * 100)
    -- Using NULLIF on the denominator prevents "Divide by Zero" errors if the warehouse totals are exactly 0
    CAST(
        ((d.Stock_Total * ISNULL(d.Ultimo_Costo_Compra_USD, 0)) / NULLIF(r.Valor_Total_Costo_USD, 0)) * 100 
    AS DECIMAL(18,2)) AS [Porc_Participacion_Costo],

    CAST(
        ((d.Stock_Total * ISNULL(d.Ultimo_Precio_Venta_USD, 0)) / NULLIF(r.Valor_Total_Venta_USD, 0)) * 100 
    AS DECIMAL(18,2)) AS [Porc_Participacion_Venta]

FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioDolarizado] d
CROSS JOIN 
    [desarrollo].[dbo].[aaron_view_TotalInventarioDolarizado] r
WHERE 
    d.Stock_Total > 0;
GO