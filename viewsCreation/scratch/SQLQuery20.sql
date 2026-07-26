DECLARE @Mes INT = 3;  -- Change to the month you want
DECLARE @Anio INT = 2025; -- Change to the year you want

-- 1. Calculate the Start and End dates for the "Calendar" window
DECLARE @InicioMes DATETIME = DATEFROMPARTS(@Anio, @Mes, 1);
DECLARE @FinMes DATETIME = EOMONTH(@InicioMes);

WITH 
Compras AS (
    -- "The Truck": Everything that arrived
    SELECT r.co_art, SUM(r.total_art) AS Qty_Purchased
    FROM saFacturaCompraReng r
    INNER JOIN saFacturaCompra f ON r.doc_num = f.doc_num
    WHERE f.anulado = 0 AND f.fec_emis BETWEEN @InicioMes AND @FinMes
    GROUP BY r.co_art
),
Ventas AS (
    -- "The Selling": Everything that left
    SELECT r.co_art, SUM(r.total_art) AS Qty_Sold
    FROM saFacturaVentaReng r
    INNER JOIN saFacturaVenta f ON r.doc_num = f.doc_num
    WHERE f.anulado = 0 AND f.fec_emis BETWEEN @InicioMes AND @FinMes
    GROUP BY r.co_art
),
MovimientosPosteriores AS (
    -- This is the "Time Travel" logic: 
    -- Everything that happened from the end of that month until TODAY
    SELECT r.co_art, 
           SUM(CASE WHEN TipoDoc = 'Compra' THEN r.total_art ELSE 0 END) as ComprasFuturas,
           SUM(CASE WHEN TipoDoc = 'Venta' THEN r.total_art ELSE 0 END) as VentasFuturas
    FROM (
        SELECT co_art, total_art, 'Compra' as TipoDoc FROM saFacturaCompraReng r 
        INNER JOIN saFacturaCompra f ON r.doc_num = f.doc_num 
        WHERE f.anulado = 0 AND f.fec_emis > @FinMes
        UNION ALL
        SELECT co_art, total_art, 'Venta' as TipoDoc FROM saFacturaVentaReng r 
        INNER JOIN saFacturaVenta f ON r.doc_num = f.doc_num 
        WHERE f.anulado = 0 AND f.fec_emis > @FinMes
    ) r
    GROUP BY r.co_art
),
StockSnapshot AS (
    -- We take the current stock and "reverse" movements to find the end-of-month stock
    SELECT s.co_art, 
           (SUM(s.stock) + ISNULL(m.VentasFuturas, 0) - ISNULL(m.ComprasFuturas, 0)) AS Stock_Al_Final_Del_Mes
    FROM saStockAlmacen s
    LEFT JOIN MovimientosPosteriores m ON s.co_art = m.co_art
    GROUP BY s.co_art, m.VentasFuturas, m.ComprasFuturas
)

SELECT 
    a.co_art AS [Codigo],
    a.art_des AS [Descripcion],
    -- BEFORE: (Final - In + Out)
    (ISNULL(ss.Stock_Al_Final_Del_Mes, 0) - ISNULL(c.Qty_Purchased, 0) + ISNULL(v.Qty_Sold, 0)) AS [Stock_Inicial_Mes],
    ISNULL(c.Qty_Purchased, 0) AS [Entradas_El_Camion],
    ISNULL(v.Qty_Sold, 0) AS [Salidas_Venta],
    -- AFTER:
    ISNULL(ss.Stock_Al_Final_Del_Mes, 0) AS [Stock_Final_Mes]
FROM saArticulo a
LEFT JOIN StockSnapshot ss ON a.co_art = ss.co_art
LEFT JOIN Compras c ON a.co_art = c.co_art
LEFT JOIN Ventas v ON a.co_art = v.co_art
WHERE a.anulado = 0 AND a.tipo = 'V'
  AND (ISNULL(c.Qty_Purchased, 0) > 0 OR ISNULL(v.Qty_Sold, 0) > 0 OR ISNULL(ss.Stock_Al_Final_Del_Mes, 0) > 0)
ORDER BY [Entradas_El_Camion] DESC;