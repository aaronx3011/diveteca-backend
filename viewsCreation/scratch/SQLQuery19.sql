SELECT 
    s.co_alma AS [Almacen],
    a.co_art AS [Codigo],
    a.art_des AS [Descripcion],
    s.stock AS [Cantidad_Disponible]
FROM [A_MEDVAL_A].[dbo].[saStockAlmacen] AS s
INNER JOIN [A_MEDVAL_A].[dbo].[saArticulo] AS a ON s.co_art = a.co_art
WHERE a.anulado = 0 
  AND a.tipo = 'V'
  AND s.stock <> 0
ORDER BY s.co_alma, a.co_art;