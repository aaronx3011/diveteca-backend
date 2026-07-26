import { Request, Response } from 'express';
import { DataService } from '../services/DataService';
import { ALLOWED_VIEWS } from '../constants/views';
import { DataSerializer } from '../serializers/DataSerializer';
import { Totalizer } from '../utils/totalizer';
import { VentasService } from '../services/VentasService';

export class VentasController {
    
    // Returns available views for frontend dropdowns/navigation
    static async getAvailableViews(req: Request, res: Response) {
        res.json({ views: ALLOWED_VIEWS });
    }


    // Fetches annual sales data
    static async getVentasAnualData(req: Request, res: Response) {
        try {
            const year = req.params.year as string || null;
            const rawData = await VentasService.getVentasAnual(year);
            const cleanData = DataSerializer.serialize(rawData);
            const totals = Totalizer.calculateTotals(cleanData);
            res.status(200).json({
                metadata: {
                    year
                },
                totals,
                data: cleanData
            });
        } catch (error: any) {
            console.error(`Error fetching annual sales data:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    static async getVentasMensualData(req: Request, res: Response) {
        try {
            const year = req.params.year as string || null;
            const rawData = await VentasService.getVentasMensual(year);
            const cleanData = DataSerializer.serialize(rawData);
            const totals = Totalizer.calculateTotals(cleanData);
            res.status(200).json({
                metadata: {
                    year
                },
                totals,
                data: cleanData
            });
        } catch (error: any) {
            console.error(`Error fetching monthly sales data:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
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

    static async getVentasMensualPorProductoData(req: Request, res: Response) {
        try {
            const producto = req.params.producto as string;
            const rawData = await VentasService.getVentasMensualPorProducto(producto);
            const cleanData = DataSerializer.serialize(rawData);
            const totals = Totalizer.calculateTotals(cleanData);
            res.status(200).json({
                metadata: {
                    producto
                },
                totals,
                data: cleanData
            });
        } catch (error: any) {
            console.error(`Error fetching product sales data:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    static async getVentasAgrupadoMensualPorProductoData(req: Request, res: Response) {
        const { startYear, startMonth, endYear, endMonth } = req.query; 
        try {
            const dateRange = {
                startYear: parseInt(startYear as string, 10),
                startMonth: parseInt(startMonth as string, 10),
                endYear: parseInt(endYear as string, 10),
                endMonth: parseInt(endMonth as string, 10),
            };
            const rawData = await VentasService.getVentasAgrupadoMensualPorProducto(dateRange);
            const cleanData = DataSerializer.serialize(rawData);
            const totals = Totalizer.calculateTotals(cleanData);
            res.status(200).json({
                metadata: {
                    startYear,
                    startMonth,
                    endYear,
                    endMonth
                },
                totals,
                data: cleanData
            });
        } catch (error: any) {
            console.error(`Error fetching grouped monthly product sales data:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    static async getVentasDetalleProductoMensualFechasData(req: Request, res: Response) {
        const { startYear, startMonth, endYear, endMonth, producto } = req.query;
        try {
            const dateRange = {
                startYear: parseInt(startYear as string, 10),
                startMonth: parseInt(startMonth as string, 10),
                endYear: parseInt(endYear as string, 10),
                endMonth: parseInt(endMonth as string, 10),
            };
            const rawData = await VentasService.getVentasDetalleProductoMensualFechas(producto as string, dateRange);
            const cleanData = DataSerializer.serialize(rawData);
            const totals = Totalizer.calculateTotals(cleanData);
            res.status(200).json({
                metadata: {
                    startYear,
                    startMonth,
                    endYear,
                    endMonth,
                    producto
                },
                totals,
                data: cleanData
            });
        } catch (error: any) {
            console.error(`Error fetching detailed monthly product sales data:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }



    static async getVentasFechasDisponiblesData(req: Request, res: Response) {
        try {
            const fechas = await VentasService.getVentasFechasDisponibles();
            res.status(200).json({
                metadata: {},
                data: fechas
            });
        } catch (error: any) {
            console.error(`Error fetching available sales dates:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    static async getVentasTopClientesActualData(req: Request, res: Response) {
        try {
            const rawData = await VentasService.getVentasTopClientesActual();
            const cleanData = DataSerializer.serialize(rawData);
            const totals = Totalizer.calculateTotals(cleanData);
            res.status(200).json({
                metadata: {},
                totals,
                data: cleanData
            });
        } catch (error: any) {
            console.error(`Error fetching top clients data:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    static async getVentasClientesPorProductoData(req: Request, res: Response) {
        try {
            const producto = req.params.producto as string;
            const rawData = await VentasService.getVentasClientesPorProducto(producto);
            const cleanData = DataSerializer.serialize(rawData);
            const totals = Totalizer.calculateTotals(cleanData);
            res.status(200).json({
                metadata: {},
                totals,
                data: cleanData
            });
        } catch (error: any) {
            console.error(`Error fetching clients by product data:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    static async getVentasDetallePorClienteData(req: Request, res: Response) {
        try {
            const cliente = req.params.cliente as string;
            const rawData = await VentasService.getVentasDetallePorCliente(cliente);
            const cleanData = DataSerializer.serialize(rawData);
            const totals = Totalizer.calculateTotals(cleanData);
            res.status(200).json({
                metadata: {},
                totals,
                data: cleanData
            });
        } catch (error: any) {
            console.error(`Error fetching detailed sales data by client:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    static async getVentasAgrupadoPorClienteAnualData(req: Request, res: Response) {
        try {
            const rawData = await VentasService.getVentasAgrupadoPorClienteAnual();
            const cleanData = DataSerializer.serialize(rawData);
            const totals = Totalizer.calculateTotals(cleanData);
            res.status(200).json({
                metadata: {},
                totals,
                data: cleanData
            });
        } catch (error: any) {
            console.error(`Error fetching annual grouped sales data by client:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    static async getVentasAgrupadoAnualPorMesPorProductoData(req: Request, res: Response) {
        try {
            const rawData = await VentasService.getVentasAgrupadoAnualPorMesPorProducto();
            const cleanData = DataSerializer.serialize(rawData);
            const totals = Totalizer.calculateTotals(cleanData);
            res.status(200).json({
                metadata: {},
                totals,
                data: cleanData
            });
        } catch (error: any) {
            console.error(`Error fetching annual grouped sales data by month:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    static async getVentasProductoPorClienteData(req: Request, res: Response) {
        try {
            const cliente = req.params.cliente as string;
            const rawData = await VentasService.getVentasProductoPorCliente(cliente);
            const cleanData = DataSerializer.serialize(rawData);
            const totals = Totalizer.calculateTotals(cleanData);
            res.status(200).json({
                metadata: {},
                totals,
                data: cleanData
            });
        } catch (error: any) {
            console.error(`Error fetching products by client data:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    static async getVentasDetallePorMesPorAnioData(req: Request, res: Response) {
        try {
            const year = req.query.year as string;
            const month = req.query.month as string;
            const rawData = await VentasService.getVentasDetallePorMesPorAnio(year, month);
            const cleanData = DataSerializer.serialize(rawData);
            const totals = Totalizer.calculateTotals(cleanData);
            res.status(200).json({
                metadata: {},
                totals,
                data: cleanData
            });
        } catch (error: any) {
            console.error(`Error fetching detailed sales data by month and year:`, error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}
