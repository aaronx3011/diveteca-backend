SELECT 
    CAST(fec_emis AS DATE) AS Fecha,
    SUM(total_bruto * tasa) AS Total_Base_Currency,
    co_mone AS Moneda
FROM [A_MEDVAL_A].[dbo].[saFacturaVenta]
WHERE anulado = 0
GROUP BY CAST(fec_emis AS DATE), co_mone
ORDER BY Fecha DESC;