import { Request, Response } from 'express';
import { ALLOWED_VIEWS } from '../constants/views';
import { DataSerializer } from '../serializers/DataSerializer';
import { Totalizer } from '../utils/totalizer';
import { InventarioService } from '../services/InventarioService';

export class InventarioController {
    
    static async getInventarioTotalData(req: Request, res: Response) {



        try {
            const fechas = await InventarioService.getInventarioTotal();
            res.status(200).json({
                metadata: {},
                data: fechas
            });
        } catch (error: any) {
            console.error(`Error fetching available sales dates:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    static async getLotesByProducto(req: Request, res: Response) {
        try {
            const codigoArticulo = req.params.codigoArticulo as string;
            const data = await InventarioService.getLotesByProducto(codigoArticulo);
            res.status(200).json({ data });
        } catch (error: any) {
            console.error(`Error fetching lotes by producto:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    static async getAlmacenesList(req: Request, res: Response) {
        try {
            const data = await InventarioService.getAlmacenesList();
            res.status(200).json({ data });
        } catch (error: any) {
            console.error(`Error fetching almacenes list:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    static async getAlmacenesExcluidos(req: Request, res: Response) {
        try {
            const data = await InventarioService.getAlmacenesExcluidos();
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
            console.error(`Error removing almacen excluido:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}