import sql from 'mssql';
import dotenv from 'dotenv';
import { HealthService } from '../services/HealthService';

dotenv.config();

const dbConfig = {
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    server: process.env.DB_SERVER as string,
    database: process.env.DB_NAME as string,
    options: {
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 5000,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool: sql.ConnectionPool | null = null;
let isConnected = false;
let connectionAttempts = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_RETRY_INTERVAL = 60000;

const poolPromise: Promise<sql.ConnectionPool | null> = new Promise(resolve => {
    attemptInitialConnection(resolve);
});

function markUnavailable(): void {
    isConnected = false;
    HealthService.setMssqlAvailable(false);
    HealthService.incrementMssqlFailureCount();
    scheduleRetry();
}

function cancelRetry(): void {
    if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
    }
}

function onConnectSuccess(newPool: sql.ConnectionPool): void {
    cancelRetry();
    pool = newPool;
    isConnected = true;
    connectionAttempts = 0;
    HealthService.setMssqlAvailable(true);
    HealthService.resetMssqlFailureCount();

    newPool.on('error', (err: Error) => {
        console.error('🔴 MSSQL pool error:', err.message);
        markUnavailable();
    });

    console.log(`✅ Connected to SQL Server at ${process.env.DB_SERVER}`);
}

function scheduleRetry(): void {
    if (retryTimer) return;
    const delay = Math.min(Math.pow(2, connectionAttempts) * 1000, MAX_RETRY_INTERVAL);
    console.log(`🔄 Retrying MSSQL in ${delay / 1000}s...`);
    retryTimer = setTimeout(async () => {
        retryTimer = null;
        await attemptReconnect();
    }, delay);
}

async function attemptReconnect() {
    try {
        connectionAttempts++;
        const newPool = await new sql.ConnectionPool(dbConfig).connect();
        onConnectSuccess(newPool);
        console.log(`✅ Reconnected to SQL Server at ${process.env.DB_SERVER}`);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`❌ MSSQL reconnection failed (attempt ${connectionAttempts}):`, msg);
        markUnavailable();
    }
}

async function attemptInitialConnection(resolve: (value: sql.ConnectionPool | null) => void) {
    try {
        connectionAttempts++;
        const newPool = await new sql.ConnectionPool(dbConfig).connect();
        onConnectSuccess(newPool);
        resolve(pool);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Database Connection Failed (attempt ${connectionAttempts}):`, msg);
        markUnavailable();
        resolve(null);
    }
}

export async function getPool(): Promise<sql.ConnectionPool> {
    if (pool && isConnected) {
        return pool;
    }

    if (!HealthService.getMssqlAvailable() && HealthService.shouldRetryMssql()) {
        try {
            const newPool = await new sql.ConnectionPool(dbConfig).connect();
            onConnectSuccess(newPool);
            return pool!;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`❌ MSSQL not available:`, msg);
            markUnavailable();
            throw new Error('MSSQL is not available');
        }
    }

    throw new Error('MSSQL is not available');
}

export function isMssqlConnected(): boolean {
    return isConnected;
}

export default poolPromise;