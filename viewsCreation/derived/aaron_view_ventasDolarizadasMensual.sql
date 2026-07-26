USE [desarrollo]
GO

/****** Object:  View [dbo].[aaron_view_ventasDolarizadasMensual]    Script Date: 4/25/2026 5:31:05 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[aaron_view_ventasDolarizadasMensual] AS
SELECT 
    YEAR(Fecha_Emision) AS [Anio],
    MONTH(Fecha_Emision) AS [Mes],
    SUM(Cantidad) AS [Total_Unidades],
    SUM(Monto_Renglon_VES) AS [Total_VES],
    SUM(Monto_Renglon_USD) AS [Total_USD],
    COUNT(DISTINCT Factura) AS [Total_Facturas]
FROM [desarrollo].[dbo].[aaron_view_DetalleVentasDolarizadas]
GROUP BY YEAR(Fecha_Emision), MONTH(Fecha_Emision);

GO


