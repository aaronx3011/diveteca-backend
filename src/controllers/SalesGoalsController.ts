import { Request, Response } from 'express';
import { SalesGoalsService } from '../services/SalesGoalsService';
import { CacheService } from '../services/CacheService';
import { ServiceUnavailableError } from '../utils/errors';

export class SalesGoalsController {
    static async getAll(req: Request, res: Response) {
        try {
            const goals = await SalesGoalsService.getAll();
            if (CacheService.lastHitWasStale) {
                res.setHeader('X-Cache-Stale', 'true');
                CacheService.lastHitWasStale = false;
            }
            res.status(200).json({ data: goals });
        } catch (error: any) {
            console.error('Error fetching sales goals:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string, 10);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'Invalid ID' });
            }
            const goal = await SalesGoalsService.getById(id);
            if (!goal) {
                return res.status(404).json({ error: 'Sales goal not found' });
            }
            if (CacheService.lastHitWasStale) {
                res.setHeader('X-Cache-Stale', 'true');
                CacheService.lastHitWasStale = false;
            }
            res.status(200).json({ data: goal });
        } catch (error: any) {
            console.error('Error fetching sales goal:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const { year, month, goal_amount } = req.body;

            if (!Number.isInteger(year) || year < 2000 || year > 2099) {
                return res.status(400).json({ error: 'year must be an integer between 2000 and 2099' });
            }
            if (!Number.isInteger(month) || month < 1 || month > 12) {
                return res.status(400).json({ error: 'month must be an integer between 1 and 12' });
            }
            if (typeof goal_amount !== 'number' || goal_amount <= 0) {
                return res.status(400).json({ error: 'goal_amount must be a positive number' });
            }

            const goal = await SalesGoalsService.create(year, month, goal_amount);
            res.status(201).json({ data: goal });
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError) {
                return res.status(503).json({ error: 'service_unavailable', message: error.message });
            }
            if (error.code === 'EREQUEST' && error.number === 2627) {
                return res.status(409).json({ error: 'A goal for this year/month already exists' });
            }
            console.error('Error creating sales goal:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string, 10);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'Invalid ID' });
            }

            const { goal_amount } = req.body;
            if (typeof goal_amount !== 'number' || goal_amount <= 0) {
                return res.status(400).json({ error: 'goal_amount must be a positive number' });
            }

            const goal = await SalesGoalsService.update(id, goal_amount);
            if (!goal) {
                return res.status(404).json({ error: 'Sales goal not found' });
            }
            res.status(200).json({ data: goal });
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError) {
                return res.status(503).json({ error: 'service_unavailable', message: error.message });
            }
            console.error('Error updating sales goal:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string, 10);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'Invalid ID' });
            }

            const deleted = await SalesGoalsService.delete(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Sales goal not found' });
            }
            res.status(200).json({ message: 'Sales goal deleted' });
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError) {
                return res.status(503).json({ error: 'service_unavailable', message: error.message });
            }
            console.error('Error deleting sales goal:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
