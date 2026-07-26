USE [desarrollo]
GO

CREATE VIEW [dbo].[aaron_view_VentasDolarizadas] 
AS
SELECT 
    f.doc_num AS [Factura],
    f.fec_emis AS [Fecha_Emision],
    f.co_cli AS [Codigo_Cliente],
    -- New Client Fields
    c.cli_des AS [Nombre_Cliente],
    c.tip_cli AS [Tipo_Cliente],
    c.direc1 AS [Direccion_Fiscal],
    c.fecha_reg AS [Fecha_Registro_Cliente],
    c.email AS [Email_Cliente],
    -- Financial Fields
    f.total_bruto AS [Monto_Original_VES],
    f.co_mone AS [Moneda_Doc],
    -- The rate found in the saTasa table using look-back logic
    TasaHist.tasa_v AS [Tasa_USD_Aplicada],
    TasaHist.fecha AS [Fecha_De_La_Tasa],
    -- USD Calculations
    CAST(f.total_bruto / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Total_Bruto_USD],
    CAST(f.total_neto / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Total_Neto_USD]
FROM [A_MEDVAL_A].[dbo].[saFacturaVenta] AS f
LEFT JOIN [A_MEDVAL_A].[dbo].[saCliente] AS c ON f.co_cli = c.co_cli
OUTER APPLY (
    -- Look for the closest USD rate on or BEFORE the invoice date
    SELECT TOP 1 t.tasa_v, t.fecha
    FROM [A_MEDVAL_A].[dbo].[saTasa] AS t
    WHERE t.co_mone = 'USD' 
      AND CAST(t.fecha AS DATE) <= CAST(f.fec_emis AS DATE)
    ORDER BY t.fecha DESC
) AS TasaHist
WHERE f.anulado = 0;
GO