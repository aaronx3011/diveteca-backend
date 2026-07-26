USE [desarrollo]
GO

/****** Object:  View [dbo].[aaron_view_AnalisisReposicionInventario] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[aaron_view_AnalisisReposicionInventario] AS
SELECT 
    inv.Codigo_Articulo,
    inv.Ref_Articulo,
    inv.Descripcion_Articulo,
    inv.Stock_Total,
    inv.Proximo_Vencimiento,
    
    -- Status Column: Instantly identifies problem stock
    CASE 
        WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN 'VENCIDO'
        WHEN DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) <= 30 THEN 'CRITICO'
        ELSE 'VIGENTE'
    END AS [Estado_Stock],

    -- 1. Current Sales Speed (Velocity)
    ISNULL(prom.Promedio_Mensual_Unidades, 0) AS [Venta_Promedio_Mensual_Actual],
    
    -- 2. How many months will the stock last based on current sales?
    -- If it's expired, we show 0 months left because it shouldn't be in the sellable shelf.
    CAST(
        CASE 
            WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN 0 
            ELSE inv.Stock_Total / NULLIF(prom.Promedio_Mensual_Unidades, 0) 
        END 
    AS DECIMAL(18,2)) AS [Meses_De_Inventario_Restante],

    -- 3. The Corrected "Race Against Time" Target:
    CAST(
        CASE 
            -- IF EXPIRED: The target is the full stock (to be cleared immediately)
            WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN inv.Stock_Total 
            
            -- IF EXPIRING THIS MONTH: The target is the full stock
            WHEN DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) <= 30 THEN inv.Stock_Total 
            
            -- IF FUTURE: Divide stock by months remaining (Days / 30.0)
            ELSE inv.Stock_Total / (DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) / 30.0)
        END
    AS DECIMAL(18,2)) AS [Meta_Venta_Mensual_Para_No_Perder],

    inv.Ultimo_Precio_Venta_USD,
    inv.Ultimo_Costo_Compra_USD

FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioDolarizado] AS inv
LEFT JOIN 
    [desarrollo].[dbo].[aaron_view_PromedioVentasUltimoAnio] AS prom 
    ON inv.Codigo_Articulo = prom.Codigo_Articulo;
GO