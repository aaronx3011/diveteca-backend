SELECT 
    YEAR(fec_emis) AS Anio,
    MONTH(fec_emis) AS Mes,
    -- This calculates the real value in base currency using the saved exchange rate
    SUM(total_bruto * tasa) AS Total_Consolidado_Base,
    COUNT(doc_num) AS Cantidad_Facturas
FROM [A_MEDVAL_A].[dbo].[saFacturaVenta]
WHERE anulado = 0
GROUP BY YEAR(fec_emis), MONTH(fec_emis)
ORDER BY Anio DESC, Mes DESC;