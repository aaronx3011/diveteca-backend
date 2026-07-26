USE [desarrollo]
GO

CREATE VIEW [dbo].[aaron_view_InventarioPorProducto]
AS
SELECT 
    Codigo_Articulo,
    Ref_Articulo,
    Nombre_Articulo,
    COUNT(DISTINCT Codigo_Almacen) AS Almacenes_Distintos,
    SUM(Unidades) AS Total_Unidades,
    MIN(Fecha_Vencimiento) AS Proximo_Vencimiento,
    CAST(SUM(Total_Ultimo_Precio_Venta_USD) AS DECIMAL(18,2)) AS Total_Valor_Venta_USD,
    CAST(SUM(Total_Ultimo_Costo_Compra_USD) AS DECIMAL(18,2)) AS Total_Valor_Costo_USD
FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioAlmacenLoteVencimientoDolarizado]
GROUP BY 
    Codigo_Articulo,
    Ref_Articulo,
    Nombre_Articulo
GO
