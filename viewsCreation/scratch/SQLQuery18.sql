SELECT 
    a.co_art AS [Codigo],
    a.art_des AS [Descripcion],
    a.co_lin AS [Linea],
    SUM(s.stock) AS [Cantidad_Total]
FROM [A_MEDVAL_A].[dbo].[saArticulo] AS a
INNER JOIN [A_MEDVAL_A].[dbo].[saStockAlmacen] AS s ON a.co_art = s.co_art
WHERE a.anulado = 0   -- Exclude deleted items
  AND a.tipo = 'V'    -- Only physical products (Venta), no services
GROUP BY a.co_art, a.art_des, a.co_lin
HAVING SUM(s.stock) > 0 -- Optional: hide items with zero stock
ORDER BY [Cantidad_Total] DESC;