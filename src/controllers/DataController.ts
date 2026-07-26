import { Request, Response } from 'express';
import { DataService } from '../services/DataService';
import { ALLOWED_VIEWS } from '../constants/views';
import { DataSerializer } from '../serializers/DataSerializer';
import { Totalizer } from '../utils/totalizer';

export class DataController {
    
    // Returns available views for frontend dropdowns/navigation
    static async getAvailableViews(req: Request, res: Response) {
        res.json({ views: ALLOWED_VIEWS });
    }

    // Fetches Data, applies serializers and totalizers
    static async getViewData(req: Request, res: Response) {
        try {
            const viewName = req.params.viewName;
            
            // 1. Validate View Name (Security)
            if (!ALLOWED_VIEWS.includes(viewName as string)) {
                return res.status(400).json({ error: "Invalid View Name requested." });
            }

            // 2. Pagination mapping (Default: 50 items, as your CSVs had limited rows)
            const limit = parseInt(req.query.limit as string) || 50; 
            const page = parseInt(req.query.page as string) || 1;
            const offset = (page - 1) * limit;

            // 3. Fetch Data from Service
            const rawData = await DataService.getDashboardData(viewName as string, limit, offset);

            // 4. Serialize Data (Clean Strings, Dates)
            const cleanData = DataSerializer.serialize(rawData);

            // 5. Run Totalizer for Dashboard Summaries
            const totals = Totalizer.calculateTotals(cleanData);

            // 6. Return standard API response
            res.status(200).json({
                metadata: {
                    view: viewName,
                    page,
                    limit,
                    count: cleanData.length
                },
                totals, // Perfect for Top-Level Dashboard Cards
                data: cleanData // Perfect for Charts & Data Tables
            });

        } catch (error: any) {
            console.error(`Error fetching view ${req.params.viewName}:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}