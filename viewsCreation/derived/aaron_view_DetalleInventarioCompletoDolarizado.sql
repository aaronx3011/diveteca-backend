USE [desarrollo]
GO

CREATE VIEW [dbo].[aaron_view_DetalleInventarioCompletoDolarizado]
AS
SELECT 
    v1.Codigo_Articulo, 
    v1.Ref_Articulo,
    v1.Nombre_Articulo, 
    v1.Codigo_Almacen, 
    v1.Nombre_Almacen,
    v1.Unidades,
    v1.Fecha_Vencimiento,
    v1.Lote,
    v2.Ultimo_Precio_Venta_USD,
    v2.Ultimo_Costo_Compra_USD,
    CAST(v1.Unidades * v2.Ultimo_Costo_Compra_USD AS DECIMAL(18,2)) AS Total_Ultimo_Costo_Compra_USD,
    CAST(v1.Unidades * v2.Ultimo_Precio_Venta_USD AS DECIMAL(18,2)) AS Total_Ultimo_Precio_Venta_USD
FROM 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioCompleto] v1
INNER JOIN 
    [desarrollo].[dbo].[aaron_view_DetalleInventarioDolarizado] v2 ON v1.Codigo_Articulo = v2.Codigo_Articulo
GO
