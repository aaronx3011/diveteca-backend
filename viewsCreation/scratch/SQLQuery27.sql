SELECT 
    Lineas.Factura,
    Lineas.Fecha_Emision,
    -- Local Currency Comparison
    Lineas.Total_Lineas_VES,
    Header.total_neto AS Total_Header_VES,
    (Lineas.Total_Lineas_VES - Header.total_neto) AS Diferencia_VES,
    
    -- USD Comparison
    Lineas.Total_Lineas_USD,
    CAST(Header.total_neto / NULLIF(Lineas.Tasa_USD_Aplicada, 0) AS DECIMAL(18,2)) AS Total_Header_USD,
    (Lineas.Total_Lineas_USD - CAST(Header.total_neto / NULLIF(Lineas.Tasa_USD_Aplicada, 0) AS DECIMAL(18,2))) AS Diferencia_USD
FROM (
    -- Grouping the Detailed View by Invoice
    SELECT 
        Factura,
        Fecha_Emision,
        Tasa_USD_Aplicada,
        SUM(Monto_Renglon_VES) AS Total_Lineas_VES,
        SUM(Monto_Renglon_USD) AS Total_Lineas_USD
    FROM [dbo].[v_DetalleVentasDolarizadas]
    GROUP BY Factura, Fecha_Emision, Tasa_USD_Aplicada
) AS Lineas
INNER JOIN [A_MEDVAL_A].[dbo].[saFacturaVenta] AS Header ON Lineas.Factura = Header.doc_num
WHERE Header.anulado = 0
-- Optional: Only show rows where there is a mathematical difference
-- AND (ABS(Lineas.Total_Lineas_VES - Header.total_neto) > 0.01 OR ABS(Lineas.Total_Lineas_USD - Header.total_neto / Lineas.Tasa_USD_Aplicada) > 0.01)
ORDER BY Diferencia_USD asc;