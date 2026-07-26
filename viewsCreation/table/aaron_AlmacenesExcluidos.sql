USE [desarrollo]
GO

/****** Table for warehouses excluded from treemap ******/
DROP TABLE IF EXISTS [dbo].[aaron_AlmacenesExcluidos]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[aaron_AlmacenesExcluidos] (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo_Almacen NVARCHAR(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    Fecha_Creado DATETIME DEFAULT GETDATE()
);
GO
