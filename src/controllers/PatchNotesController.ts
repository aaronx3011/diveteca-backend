import { Request, Response } from 'express';
import { PatchNotesService } from '../services/PatchNotesService';
import { CacheService } from '../services/CacheService';

export class PatchNotesController {
    static async getAll(req: Request, res: Response) {
        try {
            const notes = await PatchNotesService.getAll();
            if (CacheService.lastHitWasStale) {
                res.setHeader('X-Cache-Stale', 'true');
                CacheService.lastHitWasStale = false;
            }
            res.status(200).json({ data: notes });
        } catch (error: any) {
            console.error('Error fetching patch notes:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string, 10);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'Invalid ID' });
            }
            const note = await PatchNotesService.getById(id);
            if (!note) {
                return res.status(404).json({ error: 'Patch note not found' });
            }
            if (CacheService.lastHitWasStale) {
                res.setHeader('X-Cache-Stale', 'true');
                CacheService.lastHitWasStale = false;
            }
            res.status(200).json({ data: note });
        } catch (error: any) {
            console.error('Error fetching patch note:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
