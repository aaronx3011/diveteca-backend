export class DataSerializer {
    /**
     * Cleans padding, trims strings, and standardizes data output
     */
    static serialize(data: any[]): any[] {
        return data.map(row => {
            const serializedRow: any = {};
            for (const [key, value] of Object.entries(row)) {
                if (typeof value === 'string') {
                    // Trim empty spaces from SQL CHAR columns
                    serializedRow[key] = value.trim();
                } else if (value instanceof Date) {
                    const year = value.getFullYear();
                    if (year < 1900 || year > 2100) {
                        serializedRow[key] = null;
                    } else {
                        serializedRow[key] = value.toISOString();
                    }
                } else {
                    serializedRow[key] = value;
                }
            }
            return serializedRow;
        });
    }
}