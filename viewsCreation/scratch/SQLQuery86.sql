SELECT 
    a.co_art AS 'Codigo_Articulo',
    a.art_des AS 'Descripcion_Articulo',
    inv.Stock_Total,
    inv.Proximo_Vencimiento,
    UltimaVenta.Precio_Unitario_Vendido_USD,
    UltimaCompra.Costo_Unitario_Comprado
FROM 
    saArticulo a

-- 1. GET TOTAL INVENTORY AND NEAREST EXPIRATION
INNER JOIN (
    SELECT 
        co_art, 
        SUM(stock_actual) AS Stock_Total, 
        MIN(fecha_expiracion) AS Proximo_Vencimiento
    FROM 
        saLoteEntrada
    WHERE 
        stock_actual > 0
    GROUP BY 
        co_art
) inv ON a.co_art = inv.co_art

-- 2. GET LAST SELLING PRICE IN USD (From your custom view)
OUTER APPLY (
    SELECT TOP 1 
        -- Dividing the total line amount by quantity to get the exact unit price
        (v.Monto_Renglon_USD / NULLIF(v.Cantidad, 0)) AS Precio_Unitario_Vendido_USD
    FROM 
        [A_MEDVAL_A].[dbo].[aaron_view_DetalleVentasDolarizadas] v
    WHERE 
        v.Codigo_Articulo = a.co_art
    ORDER BY 
        v.Fecha_Emision DESC
) UltimaVenta

-- 3. GET LAST PURCHASE COST (From native Profit Plus tables)
OUTER APPLY (
    SELECT TOP 1 
        -- In Profit Plus, 'prec_vta' on the purchase line is the unit cost you paid the vendor.
        -- If your purchases are registered in VES, you may need to divide by fc.tasa to get USD.
        fcr.prec_vta AS Costo_Unitario_Comprado 
    FROM 
        saFacturaCompraReng fcr
    INNER JOIN 
        saFacturaCompra fc ON fcr.doc_num = fc.doc_num
    WHERE 
        fcr.co_art = a.co_art
    ORDER BY 
        fc.fec_emis DESC
) UltimaCompra

ORDER BY 
    inv.Proximo_Vencimiento ASC, 
    a.co_art ASC;