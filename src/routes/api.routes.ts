import { Router } from 'express';
import { DataController } from '../controllers/DataController';
import { VentasController } from '../controllers/VentasController';
import { ClientesController } from '../controllers/ClientesController';
import { InventarioController } from '../controllers/InventarioController';
import { SalesGoalsController } from '../controllers/SalesGoalsController';
import { PatchNotesController } from '../controllers/PatchNotesController';
import { IssueReportsController } from '../controllers/IssueReportsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/views -> Get list of all dashboard components
router.get('/views', DataController.getAvailableViews);

// GET /api/view/aaron_view_Clientes?page=1&limit=5
router.get('/view/:viewName', DataController.getViewData);
    
router.get('/ventas/fechas-disponibles/', VentasController.getVentasFechasDisponiblesData);

router.get('/ventas/total-anual/', VentasController.getVentasAnualData);
router.get('/ventas/total-anual/:year', VentasController.getVentasAnualData);

router.get('/ventas/total-mensual/', VentasController.getVentasMensualData);
router.get('/ventas/total-mensual/:year', VentasController.getVentasMensualData);

router.get('/ventas/ventas-producto/', VentasController.getVentasMensualData);
router.get('/ventas/detalle-producto-mensual/:producto', VentasController.getVentasMensualPorProductoData);


router.get('/ventas/agrupado-producto-mensual/', VentasController.getVentasAgrupadoMensualPorProductoData);
router.get('/ventas/agrupado-producto-anual-total-mes/', VentasController.getVentasAgrupadoAnualPorMesPorProductoData);
router.get('/ventas/detalle-producto-mensual-fechas/', VentasController.getVentasDetalleProductoMensualFechasData);

router.get('/ventas/top-clientes-actual', VentasController.getVentasTopClientesActualData);

router.get('/ventas/clientes-por-producto/:producto', VentasController.getVentasClientesPorProductoData);
router.get('/ventas/producto-por-cliente/:cliente', VentasController.getVentasProductoPorClienteData);

router.get('/ventas/detalle-ventas-por-cliente-mensual/:cliente', VentasController.getVentasDetallePorClienteData);

router.get('/ventas/agrupado-ventas-por-cliente-anual/', VentasController.getVentasAgrupadoPorClienteAnualData);


router.get('/ventas/detalle-ventas-por-mes-por-anio/', VentasController.getVentasDetallePorMesPorAnioData);





router.get('/clientes/', ClientesController.getClientesListData);





router.get('/inventario/total/', InventarioController.getInventarioTotalData);

router.get('/inventario/lotes/:codigoArticulo', InventarioController.getLotesByProducto);
router.get('/inventario/reporte', InventarioController.getInventoryReport);
router.get('/inventario/completo', InventarioController.getCompleteInventoryReport);
router.get('/inventario/por-producto', InventarioController.getInventoryByProduct);
router.get('/inventario/por-vencimiento', InventarioController.getInventoryByExpiry);
router.get('/inventario/analisis-reposicion', InventarioController.getReplenishment);
router.get('/inventario/analisis-reposicion/:filter', InventarioController.getReplenishment);

router.get('/inventario/almacenes', InventarioController.getAlmacenesList);
router.get('/inventario/almacenes-excluidos', InventarioController.getAlmacenesExcluidos);
router.post('/inventario/almacenes-excluidos', InventarioController.addAlmacenExcluido);
router.delete('/inventario/almacenes-excluidos/:codigo', InventarioController.removeAlmacenExcluido);

router.get('/sales-goals', SalesGoalsController.getAll);
router.get('/sales-goals/:id', SalesGoalsController.getById);
router.post('/sales-goals', SalesGoalsController.create);
router.put('/sales-goals/:id', SalesGoalsController.update);
router.delete('/sales-goals/:id', SalesGoalsController.delete);

router.get('/patch-notes', PatchNotesController.getAll);
router.get('/patch-notes/:id', PatchNotesController.getById);

router.get('/issue-reports', IssueReportsController.getAll);
router.get('/issue-reports/:id', IssueReportsController.getById);
router.post('/issue-reports', IssueReportsController.create);
router.put('/issue-reports/:id', IssueReportsController.update);
router.delete('/issue-reports/:id', IssueReportsController.delete);

export default router;
