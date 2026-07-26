SELECT 
        r.co_art AS [Codigo_Articulo],
        r.des_art AS [Descripcion],
        SUM(r.total_art) AS [Cantidad_Vendida],
        SUM(r.reng_neto) AS [Total_Neto_Ventas],
        f.co_mone AS [Moneda]
    FROM [dbo].[saFacturaVenta] AS f
    INNER JOIN [dbo].[saFacturaVentaReng] AS r ON f.doc_num = r.doc_num
    WHERE f.anulado = 0  -- Only valid sales
      AND MONTH(f.fec_emis) = 5 -- Mes
      AND YEAR(f.fec_emis) = 2025 -- Anho
    GROUP BY r.co_art, r.des_art, f.co_mone
    ORDER BY [Cantidad_Vendida] DESC;