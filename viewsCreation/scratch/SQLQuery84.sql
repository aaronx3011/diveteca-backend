SELECT 
    a.co_art AS 'Codigo_Articulo',
    a.art_des AS 'Descripcion_Articulo',
    l.co_alma AS 'Codigo_Almacen',
    l.numero_lote AS 'Numero_Lote',
    l.fecha_expiracion AS 'Fecha_Expiracion',
    l.stock_actual AS 'Stock_Disponible'
FROM 
    saArticulo a
INNER JOIN 
    saLoteEntrada l ON a.co_art = l.co_art
WHERE 
    l.stock_actual > 0 
ORDER BY 
    l.fecha_expiracion ASC, 
    a.co_art ASC;