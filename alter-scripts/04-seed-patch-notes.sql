INSERT INTO [desarrollo].[dbo].[patch_notes] (title, content, version, category, published_at)
VALUES
    ('Panel de Notificaciones y Reportes',
     'Se agregó un nuevo panel de notificaciones en la campana (parte superior derecha) que muestra las últimas notas de parche y los issues abiertos. También se añadió una nueva sección en Configuración para ver el historial completo de notas de parche y reportar problemas.',
     'v1.1.0', 'New Feature', GETDATE()),
    ('Mejoras en el cálculo de metas',
     'Se corrigió el formato de visualización de montos en la página de Configuración. Ahora los valores se muestran correctamente con separadores de miles y dos decimales.',
     'v1.0.1', 'Bugfix', DATEADD(DAY, -7, GETDATE())),
    ('Lanzamiento del Dashboard',
     'Versión inicial del sistema de dashboard MedVal con módulos de Ventas, Inventario, Cuentas por Cobrar y Configuración.',
     'v1.0.0', 'New Feature', DATEADD(DAY, -30, GETDATE()));
