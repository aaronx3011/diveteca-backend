SELECT 
    a.co_art AS 'Codigo_Articulo',
    a.art_des AS 'Descripcion_Articulo',
    SUM(l.stock_actual) AS 'Stock_Total',
    MIN(l.fecha_expiracion) AS 'Proximo_Vencimiento'
FROM 
    saArticulo as a
INNER JOIN 
    saLoteEntrada l ON a.co_art = l.co_art
WHERE 
    l.stock_actual > 0 
GROUP BY 
    a.co_art, 
    a.art_des
ORDER BY 
    MIN(l.fecha_expiracion) ASC, 
    a.co_art ASC;