SELECT 
    a.co_art AS [Codigo],
    a.art_des AS [Descripcion],
    SUM(s.stock) AS [Stock_Total],
    -- Fetch the most recent average cost using the rowguid link
    LatestCost.costo_pro AS [Costo_Promedio],
    (SUM(s.stock) * LatestCost.costo_pro) AS [Valor_Total_Costo]
FROM [A_MEDVAL_A].[dbo].[saArticulo] AS a
INNER JOIN [A_MEDVAL_A].[dbo].[saStockAlmacen] AS s ON a.co_art = s.co_art
CROSS APPLY (
    SELECT TOP 1 h.costo_pro 
    FROM [A_MEDVAL_A].[dbo].[saCostoHistoricoEntrada] AS h
    WHERE h.cod_articulo_rowguid = a.rowguid -- Joining by GUID
    ORDER BY h.fecha_emision DESC, h.fecha_registro DESC
) AS LatestCost
WHERE a.anulado = 0 
  AND a.tipo = 'V' -- Merchandise only
GROUP BY a.co_art, a.art_des, LatestCost.costo_pro
HAVING SUM(s.stock) > 0
ORDER BY [Valor_Total_Costo] DESC;