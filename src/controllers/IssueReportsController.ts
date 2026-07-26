import { Request, Response } from 'express';
import { IssueReportsService } from '../services/IssueReportsService';
import { CacheService } from '../services/CacheService';
import { ServiceUnavailableError } from '../utils/errors';

const ALLOWED_SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const ALLOWED_STATUSES = ['open', 'in_review', 'resolved'];

export class IssueReportsController {
    static async getAll(req: Request, res: Response) {
        try {
            const reports = await IssueReportsService.getAll();
            if (CacheService.lastHitWasStale) {
                res.setHeader('X-Cache-Stale', 'true');
                CacheService.lastHitWasStale = false;
            }
            res.status(200).json({ data: reports });
        } catch (error: any) {
            console.error('Error fetching issue reports:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string, 10);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'Invalid ID' });
            }
            const report = await IssueReportsService.getById(id);
            if (!report) {
                return res.status(404).json({ error: 'Issue report not found' });
            }
            if (CacheService.lastHitWasStale) {
                res.setHeader('X-Cache-Stale', 'true');
                CacheService.lastHitWasStale = false;
            }
            res.status(200).json({ data: report });
        } catch (error: any) {
            console.error('Error fetching issue report:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const { title, description, reporter_name, reporter_email, severity } = req.body;

            if (!title || typeof title !== 'string' || title.trim().length === 0) {
                return res.status(400).json({ error: 'title is required' });
            }
            if (!description || typeof description !== 'string' || description.trim().length === 0) {
                return res.status(400).json({ error: 'description is required' });
            }
            if (!reporter_name || typeof reporter_name !== 'string' || reporter_name.trim().length === 0) {
                return res.status(400).json({ error: 'reporter_name is required' });
            }
            if (!reporter_email || typeof reporter_email !== 'string' || reporter_email.trim().length === 0) {
                return res.status(400).json({ error: 'reporter_email is required' });
            }
            if (!severity || !ALLOWED_SEVERITIES.includes(severity)) {
                return res.status(400).json({ error: `severity must be one of: ${ALLOWED_SEVERITIES.join(', ')}` });
            }

            const report = await IssueReportsService.create(
                title.trim(),
                description.trim(),
                reporter_name.trim(),
                reporter_email.trim(),
                severity
            );
            res.status(201).json({ data: report });
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError) {
                return res.status(503).json({ error: 'service_unavailable', message: error.message });
            }
            console.error('Error creating issue report:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string, 10);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'Invalid ID' });
            }

            const { status } = req.body;
            if (!status || !ALLOWED_STATUSES.includes(status)) {
                return res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
            }

            const report = await IssueReportsService.updateStatus(id, status);
            if (!report) {
                return res.status(404).json({ error: 'Issue report not found' });
            }
            res.status(200).json({ data: report });
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError) {
                return res.status(503).json({ error: 'service_unavailable', message: error.message });
            }
            console.error('Error updating issue report:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string, 10);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'Invalid ID' });
            }

            const deleted = await IssueReportsService.delete(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Issue report not found' });
            }
            res.status(200).json({ message: 'Issue report deleted' });
        } catch (error: any) {
            if (error instanceof ServiceUnavailableError) {
                return res.status(503).json({ error: 'service_unavailable', message: error.message });
            }
            console.error('Error deleting issue report:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
