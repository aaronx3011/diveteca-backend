USE [desarrollo]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

ALTER VIEW [dbo].[aaron_view_CuentasPorCobrarDolarizadas] AS
SELECT 
    d.nro_doc AS [Numero_Documento],
    d.co_tipo_doc AS [Tipo_Documento],
    d.fec_emis AS [Fecha_Emision],
    d.fec_venc AS [Fecha_Vencimiento],
    d.co_cli AS [Codigo_Cliente],
    c.cli_des AS [Nombre_Cliente],
    c.tip_cli AS [Tipo_Cliente],
    c.direc1 AS [Direccion_Fiscal],
    d.total_neto AS [Monto_Original_VES],
    d.saldo AS [Saldo_Pendiente_VES],
    TasaHist.tasa_v AS [Tasa_USD_Aplicada],
    CAST(d.total_neto / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Monto_Original_USD],
    CAST(d.saldo / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Saldo_Pendiente_USD],
    DATEDIFF(DAY, d.fec_venc, GETDATE()) AS [Dias_Vencidos],
    d.co_ven AS [Vendedor],
    d.co_sucu_in AS [Sucursal]
FROM [A_MEDVAL_A].[dbo].[saDocumentoVenta] AS d
LEFT JOIN [A_MEDVAL_A].[dbo].[saCliente] AS c ON d.co_cli = c.co_cli
OUTER APPLY (
    SELECT TOP 1 t.tasa_v
    FROM [A_MEDVAL_A].[dbo].[saTasa] AS t
    WHERE t.co_mone = 'USD' 
      AND CAST(t.fecha AS DATE) <= CAST(d.fec_emis AS DATE)
    ORDER BY t.fecha DESC
) AS TasaHist
WHERE d.anulado = 0 AND d.saldo > 0

UNION ALL

SELECT 
    d.nro_doc AS [Numero_Documento],
    d.co_tipo_doc AS [Tipo_Documento],
    d.fec_emis AS [Fecha_Emision],
    d.fec_venc AS [Fecha_Vencimiento],
    d.co_cli AS [Codigo_Cliente],
    c.cli_des AS [Nombre_Cliente],
    c.tip_cli AS [Tipo_Cliente],
    c.direc1 AS [Direccion_Fiscal],
    d.total_neto AS [Monto_Original_VES],
    d.saldo AS [Saldo_Pendiente_VES],
    TasaHist.tasa_v AS [Tasa_USD_Aplicada],
    CAST(d.total_neto / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Monto_Original_USD],
    CAST(d.saldo / NULLIF(TasaHist.tasa_v, 0) AS DECIMAL(18,2)) AS [Saldo_Pendiente_USD],
    DATEDIFF(DAY, d.fec_venc, GETDATE()) AS [Dias_Vencidos],
    d.co_ven AS [Vendedor],
    d.co_sucu_in AS [Sucursal]
FROM [A_TAO_A].[dbo].[saDocumentoVenta] AS d
LEFT JOIN [A_TAO_A].[dbo].[saCliente] AS c ON d.co_cli = c.co_cli
OUTER APPLY (
    SELECT TOP 1 t.tasa_v
    FROM [A_TAO_A].[dbo].[saTasa] AS t
    WHERE t.co_mone = 'USD' 
      AND CAST(t.fecha AS DATE) <= CAST(d.fec_emis AS DATE)
    ORDER BY t.fecha DESC
) AS TasaHist
WHERE d.anulado = 0 AND d.saldo > 0
  AND EXISTS (
    SELECT 1 
    FROM [A_TAO_A].[dbo].[saFacturaVentaReng] r
    INNER JOIN [A_TAO_A].[dbo].[saFacturaVenta] f ON r.doc_num = f.doc_num
    WHERE f.doc_num = d.nro_doc AND r.co_art = 'OCTA-ALB'
  );
GO
