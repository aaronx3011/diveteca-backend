SELECT 
    a.co_art AS [Codigo],
    a.art_des AS [Descripcion],
    a.co_lin AS [Linea],
    SUM(s.stock) AS [Stock_Total],
    p.costo_u1 AS [Costo_Promedio_Unidad], -- This is usually the Average Cost in Web Edition
    (SUM(s.stock) * p.costo_u1) AS [Valor_Total_Inventario],
    p.precio_1 AS [Precio_Venta_P1]
FROM [A_MEDVAL_A].[dbo].[saArticulo] AS a
INNER JOIN [A_MEDVAL_A].[dbo].[saStockAlmacen] AS s ON a.co_art = s.co_art
INNER JOIN [A_MEDVAL_A].[dbo].[saArtPrecio] AS p ON a.co_art = p.co_art
WHERE a.anulado = 0 
  AND a.tipo = 'V' -- Only Products
GROUP BY a.co_art, a.art_des, a.co_lin, p.costo_u1, p.precio_1
HAVING SUM(s.stock) > 0
ORDER BY [Valor_Total_Inventario] DESC;