import app from './app';
import { initCache } from './config/cache';
import poolPromise from './config/database';
import { HealthService } from './services/HealthService';
import { CacheService } from './services/CacheService';
import { CacheBackupService } from './services/CacheBackupService';
import { SessionsService } from './services/SessionsService';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', async () => {
    initCache();
    CacheService.purgeExpired();
    setInterval(() => CacheService.purgeExpired(), 60 * 60 * 1000).unref();
    CacheBackupService.schedule();

    const dbPool = await poolPromise;
    if (dbPool) {
        await SessionsService.reconcilePendingSessions();
        console.log(`🚀 Dashboard API Server is running on http://0.0.0.0:${PORT}`);
    } else {
        HealthService.setMssqlAvailable(false);
        console.log('⚠️  DEGRADED MODE — serving from cache. MSSQL is unavailable.');
        console.log(`🚀 Dashboard API Server is running on http://0.0.0.0:${PORT} (degraded)`);
    }
});
