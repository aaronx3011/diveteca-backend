SELECT 
    CAST(fec_emis AS DATE) AS Fecha,
    COUNT(doc_num) AS Cantidad_Facturas,
    SUM(total_neto) AS Subtotal_Neto,
    SUM(total_bruto) AS Total_Con_IVA
FROM [A_MEDVAL_A].[dbo].[saFacturaVenta]
WHERE anulado = 0  -- Filter out voided/annulled invoices
GROUP BY CAST(fec_emis AS DATE)
ORDER BY Fecha DESC;