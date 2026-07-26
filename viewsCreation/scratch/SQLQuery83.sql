SELECT 
    a.co_art AS 'Codigo_Articulo',
    a.art_des AS 'Descripcion_Articulo',
    l.nro_lote AS 'Numero_Lote',
    l.fec_venc AS 'Fecha_Vencimiento',
    l.stock AS 'Stock_Disponible'
FROM 
    saArticulo a
INNER JOIN 
    saLoteEntrada l ON a.co_art = l.co_art
WHERE 
    l.stock > 0 
ORDER BY 
    l.fec_venc ASC, 
    a.co_art ASC;