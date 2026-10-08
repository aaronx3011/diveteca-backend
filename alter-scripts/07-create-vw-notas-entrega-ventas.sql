USE [Desarrollo];
GO

CREATE OR ALTER VIEW dbo.Vw_NotasEntregaVentas
AS
SELECT
    nota.fec_emis AS Fecha,
    nota.doc_num AS Num_Nota,
    nota.co_cli AS Codigo_Cliente,
    cliente.cli_des AS Nombre_Cliente,
    renglon.co_art AS Codigo_Articulo,
    COALESCE(NULLIF(LTRIM(RTRIM(articulo.ref)), ''), LTRIM(RTRIM(articulo.co_art))) AS Ref_Articulo,
    articulo.art_des AS Descripcion_Articulo,
    renglon.co_alma AS Codigo_Almacen,
    renglon.total_art AS Cantidad,
    renglon.prec_vta / NULLIF(nota.tasa, 0) AS Precio_Unitario_USD,
    renglon.monto_desc / NULLIF(nota.tasa, 0) AS Descuento_USD,
    renglon.reng_neto / NULLIF(nota.tasa, 0) AS Neto_Renglon_USD,
    nota.anulado AS Anulado
FROM N_DIVETE_A.dbo.saNotaEntregaVenta AS nota
INNER JOIN N_DIVETE_A.dbo.saCliente AS cliente ON nota.co_cli = cliente.co_cli
INNER JOIN N_DIVETE_A.dbo.saNotaEntregaVentaReng AS renglon ON nota.doc_num = renglon.doc_num
INNER JOIN N_DIVETE_A.dbo.saArticulo AS articulo ON renglon.co_art = articulo.co_art;
GO
