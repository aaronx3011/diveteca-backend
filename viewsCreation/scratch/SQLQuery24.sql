SELECT 
    f.doc_num AS [Factura],
    f.fec_emis AS [Fecha_Emision],
    f.co_mone AS [Moneda_Factura],
    f.tasa AS [Tasa_En_Factura]
FROM [A_MEDVAL_A].[dbo].[saFacturaVenta] AS f
WHERE f.anulado = 0
  AND NOT EXISTS (
      SELECT 1 
      FROM [A_MEDVAL_A].[dbo].[saTasa] AS t
      WHERE
        CAST(t.fecha AS DATE) = CAST(f.fec_emis AS DATE)
  )
ORDER BY f.fec_emis DESC;