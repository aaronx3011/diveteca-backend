import { Request, Response } from 'express';
import { Totalizer } from '../utils/totalizer';
import { InventarioService } from '../services/InventarioService';
import { InventoryReportService } from '../services/InventoryReportService';
import type { ReplenishmentFilter } from '../types/inventory';
import { CacheService } from '../services/CacheService';
import { ServiceUnavailableError } from '../utils/errors';

export class InventarioController {
    
    static async getInventarioTotalData(req: Request, res: Response) {
        try {
            res.status(200).json(await InventarioService.getInventarioTotal());
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError || error.message === 'MSSQL is not available') return res.status(503).json({ error: 'service_unavailable' });
            console.error(`Error fetching inventory totals:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    static async getLotesByProducto(req: Request, res: Response) {
        try {
            const codigoArticulo = req.params.codigoArticulo as string;
            res.status(200).json(await InventarioService.getLotesByProducto(codigoArticulo));
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError || error.message === 'MSSQL is not available') return res.status(503).json({ error: 'service_unavailable' });
            console.error(`Error fetching lotes by producto:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    static async getInventoryReport(req: Request, res: Response) {
        try {
            const result = await InventarioService.getInventoryReport();
            res.status(200).json({ metadata: result.metadata, totals: InventoryReportService.calculateDetailTotals(result.data), data: result.data });
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError || error.message === 'MSSQL is not available') return res.status(503).json({ error: 'service_unavailable' });
            console.error('Error fetching inventory report:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getCompleteInventoryReport(req: Request, res: Response) {
        try {
            const result = await InventarioService.getCompleteInventoryReport();
            res.status(200).json({ metadata: result.metadata, totals: InventoryReportService.calculateDetailTotals(result.data), data: result.data });
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError || error.message === 'MSSQL is not available') return res.status(503).json({ error: 'service_unavailable' });
            console.error('Error fetching complete inventory report:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getInventoryByProduct(req: Request, res: Response) {
        try {
            const result = await InventarioService.getInventoryByProduct();
            res.status(200).json({ metadata: result.metadata, totals: Totalizer.calculateTotals(result.data), data: result.data });
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError || error.message === 'MSSQL is not available') return res.status(503).json({ error: 'service_unavailable' });
            console.error('Error fetching inventory by product:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getInventoryByExpiry(req: Request, res: Response) {
        try {
            const result = await InventarioService.getInventoryByExpiry();
            res.status(200).json({ metadata: result.metadata, totals: Totalizer.calculateTotals(result.data), data: result.data });
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError || error.message === 'MSSQL is not available') return res.status(503).json({ error: 'service_unavailable' });
            console.error('Error fetching inventory by expiry:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getReplenishment(req: Request, res: Response) {
        const filter = (req.params.filter ?? 'all') as ReplenishmentFilter;
        if (!(['all', 'critico', 'stock-bajo', 'activo'] as ReplenishmentFilter[]).includes(filter)) return res.status(400).json({ error: 'Invalid replenishment filter' });
        try {
            const result = await InventarioService.getReplenishment(filter);
            res.status(200).json({ metadata: result.metadata, totals: Totalizer.calculateTotals(result.data), data: result.data });
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError || error.message === 'MSSQL is not available') return res.status(503).json({ error: 'service_unavailable' });
            console.error('Error fetching replenishment analysis:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getAlmacenesList(req: Request, res: Response) {
        try {
            const data = await InventarioService.getAlmacenesList();
            if (CacheService.lastHitWasStale) {
                res.setHeader('X-Cache-Stale', 'true');
                CacheService.lastHitWasStale = false;
            }
            res.status(200).json({ data });
        } catch (error: any) {
            console.error(`Error fetching almacenes list:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    static async getAlmacenesExcluidos(req: Request, res: Response) {
        try {
            const data = await InventarioService.getAlmacenesExcluidos();
            if (CacheService.lastHitWasStale) {
                res.setHeader('X-Cache-Stale', 'true');
                CacheService.lastHitWasStale = false;
            }
            res.status(200).json({ data });
        } catch (error: any) {
            console.error(`Error fetching almacenes excluidos:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    static async addAlmacenExcluido(req: Request, res: Response) {
        try {
            const { codigo_almacen } = req.body;
            if (!codigo_almacen) {
                return res.status(400).json({ error: "codigo_almacen is required" });
            }
            await InventarioService.addAlmacenExcluido(codigo_almacen);
            res.status(201).json({ message: "Almacen excluido added" });
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError) {
                return res.status(503).json({ error: 'service_unavailable', message: error.message });
            }
            console.error(`Error adding almacen excluido:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    static async removeAlmacenExcluido(req: Request, res: Response) {
        try {
            const codigoAlmacen = req.params.codigo as string;
            await InventarioService.removeAlmacenExcluido(codigoAlmacen);
            res.status(200).json({ message: "Almacen excluido removed" });
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError) {
                return res.status(503).json({ error: 'service_unavailable', message: error.message });
            }
            console.error(`Error removing almacen excluido:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}
