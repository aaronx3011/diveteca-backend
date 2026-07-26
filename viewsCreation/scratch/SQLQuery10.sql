SELECT 
    YEAR(f.fec_emis) AS [Anio],
    MONTH(f.fec_emis) AS [Mes],
    r.co_art AS [Codigo_Articulo],
    r.des_art AS [Descripcion],
    SUM(r.total_art) AS [Cantidad_Total],
    SUM(r.reng_neto) AS [Monto_Neto_Total],
    f.co_mone AS [Moneda],
    f.tasa AS [Tasa_Cambio]
FROM [dbo].[saFacturaVenta] AS f
INNER JOIN [dbo].[saFacturaVentaReng] AS r ON f.doc_num = r.doc_num
WHERE f.anulado = 0 -- Only includes valid (non-voided) sales
GROUP BY 
    YEAR(f.fec_emis), 
    MONTH(f.fec_emis), 
    r.co_art, 
    r.des_art, 
    f.co_mone,
    f.tasa;