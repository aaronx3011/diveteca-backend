USE [desarrollo]
GO

/****** Object:  View [dbo].[aaron_view_CuentasPorCobrarAgrupadoClienteAnio]    Script Date: 4/25/2026 5:26:58 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE VIEW [dbo].[aaron_view_CuentasPorCobrarAgrupadoClienteAnio] AS
SELECT 
    -- 1. Year Grouping (Extracting the year the debt was emitted)
    YEAR(Fecha_Emision) AS [Anio_Emision],

    -- 3. General Summaries
    COUNT(Numero_Documento) AS [Total_Documentos_Pendientes],
    MAX(Dias_Vencidos) AS [Dias_Maximo_Atraso], 
    
    -- 4. Grand Totals
    CAST(SUM(Monto_Original_USD) AS DECIMAL(18,2)) AS [Total_Facturado_USD],
    CAST(SUM(Saldo_Pendiente_USD) AS DECIMAL(18,2)) AS [Deuda_Total_USD],
    CAST(SUM(Saldo_Pendiente_VES) AS DECIMAL(18,2)) AS [Deuda_Total_VES],

    -- 5. Aging Buckets (Maintains the exact debt age structure)
    CAST(SUM(CASE 
        WHEN Dias_Vencidos <= 0 THEN Saldo_Pendiente_USD 
        ELSE 0 
    END) AS DECIMAL(18,2)) AS [Por_Vencer_Al_Dia_USD],

    CAST(SUM(CASE 
        WHEN Dias_Vencidos BETWEEN 1 AND 30 THEN Saldo_Pendiente_USD 
        ELSE 0 
    END) AS DECIMAL(18,2)) AS [Vencido_1_A_30_Dias_USD],

    CAST(SUM(CASE 
        WHEN Dias_Vencidos BETWEEN 31 AND 60 THEN Saldo_Pendiente_USD 
        ELSE 0 
    END) AS DECIMAL(18,2)) AS [Vencido_31_A_60_Dias_USD],
    
    CAST(SUM(CASE 
        WHEN Dias_Vencidos BETWEEN 61 AND 90 THEN Saldo_Pendiente_USD 
        ELSE 0 
    END) AS DECIMAL(18,2)) AS [Vencido_61_A_90_Dias_USD],

    CAST(SUM(CASE 
        WHEN Dias_Vencidos > 90 THEN Saldo_Pendiente_USD 
        ELSE 0 
    END) AS DECIMAL(18,2)) AS [Vencido_Mas_De_90_Dias_USD]

FROM 
    [desarrollo].[dbo].[aaron_view_CuentasPorCobrarDolarizadas]
GROUP BY 
    YEAR(Fecha_Emision)

GO


