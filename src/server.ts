import app from './app';
import { initCache } from './config/cache';
import poolPromise from './config/database';
import { HealthService } from './services/HealthService';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', async () => {
    initCache();

    const dbPool = await poolPromise;
    if (dbPool) {
        console.log(`🚀 Dashboard API Server is running on http://0.0.0.0:${PORT}`);
    } else {
        HealthService.setMssqlAvailable(false);
        console.log('⚠️  DEGRADED MODE — serving from cache. MSSQL is unavailable.');
        console.log(`🚀 Dashboard API Server is running on http://0.0.0.0:${PORT} (degraded)`);
    }
});