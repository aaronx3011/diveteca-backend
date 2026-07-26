USE [desarrollo]
GO

/****** View for Low Stock (coverage <= 3 months, non-zero avg sales) ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER VIEW [dbo].[aaron_view_AnalisisReposicionStockBajo] AS
SELECT 
    inv.Codigo_Articulo,
    inv.Ref_Articulo,
    inv.Descripcion_Articulo,
    inv.Stock_Total,
    inv.Proximo_Vencimiento,
    
    CASE 
        WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN 'VENCIDO'
        WHEN DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) <= 30 THEN 'CRITICO'
        ELSE 'VIGENTE'
    END AS [Estado_Stock],

    ISNULL(prom.Promedio_Mensual_Unidades, 0) AS [Venta_Promedio_Mensual_Actual],
    
    CAST(
        CASE 
            WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN 0 
            ELSE inv.Stock_Total / NULLIF(prom.Promedio_Mensual_Unidades, 0) 
        END 
    AS DECIMAL(18,2)) AS [Meses_De_Inventario_Restante],

    CAST(
        CASE 
            WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN inv.Stock_Total 
            WHEN DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) <= 30 THEN inv.Stock_Total 
            ELSE inv.Stock_Total / (DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) / 30.0)
        END
    AS DECIMAL(18,2)) AS [Meta_Venta_Mensual_Para_No_Perder],

    inv.Ultimo_Precio_Venta_USD,
    inv.Ultimo_Costo_Compra_USD

FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioDolarizado] AS inv
LEFT JOIN 
    [desarrollo].[dbo].[aaron_view_PromedioVentasUltimoAnio] AS prom 
    ON inv.Codigo_Articulo = prom.Codigo_Articulo
WHERE 
    inv.Proximo_Vencimiento >= CAST(GETDATE() AS DATE)
    AND inv.Stock_Total / NULLIF(prom.Promedio_Mensual_Unidades, 0) <= 3
    AND ISNULL(prom.Promedio_Mensual_Unidades, 0) > 0;
GO
