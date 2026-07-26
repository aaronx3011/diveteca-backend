USE [desarrollo]
GO

/****** View for Critical Stock (expiring within 30 days) ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER VIEW [dbo].[aaron_view_AnalisisReposicionCritico] AS
SELECT 
    inv.Codigo_Articulo,
    inv.Ref_Articulo,
    inv.Descripcion_Articulo,
    inv.Stock_Total,
    inv.Proximo_Vencimiento,
    
    'CRITICO' AS [Estado_Stock],

    ISNULL(prom.Promedio_Mensual_Unidades, 0) AS [Venta_Promedio_Mensual_Actual],
    
    CAST(
        CASE 
            WHEN inv.Proximo_Vencimiento < CAST(GETDATE() AS DATE) THEN 0 
            ELSE inv.Stock_Total / NULLIF(prom.Promedio_Mensual_Unidades, 0) 
        END 
    AS DECIMAL(18,2)) AS [Meses_De_Inventario_Restante],

    CAST(inv.Stock_Total AS DECIMAL(18,2)) AS [Meta_Venta_Mensual_Para_No_Perder],

    inv.Ultimo_Precio_Venta_USD,
    inv.Ultimo_Costo_Compra_USD

FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioDolarizado] AS inv
LEFT JOIN 
    [desarrollo].[dbo].[aaron_view_PromedioVentasUltimoAnio] AS prom 
    ON inv.Codigo_Articulo = prom.Codigo_Articulo
WHERE 
    inv.Proximo_Vencimiento >= CAST(GETDATE() AS DATE)
    AND DATEDIFF(DAY, GETDATE(), inv.Proximo_Vencimiento) <= 30;
GO
