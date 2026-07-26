export class Totalizer {
    /**
     * Automatically detect numeric fields and return a summary of totals
     */
    static calculateTotals(data: any[]): Record<string, number> {
        const totals: Record<string, number> = {};

        data.forEach(row => {
            for (const [key, value] of Object.entries(row)) {
                if (typeof value === 'number') {
                    // Initialize the key if it doesn't exist
                    if (!totals[key]) totals[key] = 0;
                    
                    // Accumulate totals
                    totals[key] += value;
                    
                    // Keep floats to 2 decimal places to avoid standard JS math errors
                    totals[key] = Math.round(totals[key] * 100) / 100;
                }
            }
        });

        return totals;
    }
}