import { Request, Response } from 'express';
import { ALLOWED_VIEWS } from '../constants/views';
import { DataSerializer } from '../serializers/DataSerializer';
import { Totalizer } from '../utils/totalizer';
import { ClientesService } from '../services/ClientesService';
import { CacheService } from '../services/CacheService';

export class ClientesController {
    
    static async getClientesListData(req: Request, res: Response) {




        try {
            const fechas = await ClientesService.getClientesList();
            if (CacheService.lastHitWasStale) {
                res.setHeader('X-Cache-Stale', 'true');
                CacheService.lastHitWasStale = false;
            }
            res.status(200).json({
                metadata: {},
                data: fechas
            });
        } catch (error: any) {
            console.error(`Error fetching available sales dates:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}