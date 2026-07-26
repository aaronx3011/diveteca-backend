WITH Oncoming AS (
    -- Items ordered but not yet received (Purchase Orders)
    -- Using your field 'pendiente' for the "oncoming" quantity
    SELECT r.co_art, SUM(r.pendiente) AS Qty_On_The_Way
    FROM [A_MEDVAL_A].[dbo].[saOrdenCompraReng] r
    INNER JOIN [A_MEDVAL_A].[dbo].[saOrdenCompra] f ON r.doc_num = f.doc_num
    WHERE f.anulado = 0 
      AND r.pendiente > 0 -- Only items still expected from the supplier
    GROUP BY r.co_art
),
JustDelivered AS (
    -- Items received in the last 48 hours (Nota de Recepción)
    -- This assumes saNotaRecepcionCompraReng follows your same field naming
    SELECT r.co_art, SUM(r.total_art) AS Qty_Recently_Received
    FROM [A_MEDVAL_A].[dbo].[saNotaRecepcionCompraReng] r
    INNER JOIN [A_MEDVAL_A].[dbo].[saNotaRecepcionCompra] f ON r.doc_num = f.doc_num
    WHERE f.anulado = 0 
      AND f.fec_emis >= DATEADD(day, -2, GETDATE()) 
    GROUP BY r.co_art
),
CurrentStock AS (
    -- Your physical reality on the shelf right now
    SELECT co_art, SUM(stock) AS Qty_In_Hand
    FROM [A_MEDVAL_A].[dbo].[saStockAlmacen]
    GROUP BY co_art
)

SELECT 
    a.co_art AS [Codigo],
    a.art_des AS [Descripcion],
    ISNULL(cs.Qty_In_Hand, 0) AS [Stock_Actual],
    ISNULL(jd.Qty_Recently_Received, 0) AS [Entregado_Reciente_Dock],
    ISNULL(oc.Qty_On_The_Way, 0) AS [En_Camino_Pipeline]
FROM [A_MEDVAL_A].[dbo].[saArticulo] a
LEFT JOIN CurrentStock cs ON a.co_art = cs.co_art
LEFT JOIN JustDelivered jd ON a.co_art = jd.co_art
LEFT JOIN Oncoming oc ON a.co_art = oc.co_art
WHERE a.anulado = 0 AND a.tipo = 'V'
  AND (cs.Qty_In_Hand > 0 OR jd.Qty_Recently_Received > 0 OR oc.Qty_On_The_Way > 0)
ORDER BY [En_Camino_Pipeline] DESC;