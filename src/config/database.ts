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
const MAX_RETRY_INTERVAL = 60000;

const poolPromise: Promise<sql.ConnectionPool | null> = new Promise(resolve => {
    attemptConnection(resolve);
});

async function attemptConnection(resolve: (value: sql.ConnectionPool | null) => void) {
    try {
        connectionAttempts++;
        const newPool = await new sql.ConnectionPool(dbConfig).connect();
        pool = newPool;
        isConnected = true;
        connectionAttempts = 0;
        HealthService.setMssqlAvailable(true);
        HealthService.resetMssqlFailureCount();
        console.log(`✅ Connected to SQL Server at ${process.env.DB_SERVER}`);
        resolve(pool);
    } catch (err) {
        isConnected = false;
        HealthService.setMssqlAvailable(false);
        HealthService.incrementMssqlFailureCount();
        console.error(`❌ Database Connection Failed (attempt ${connectionAttempts}):`, err);

        resolve(null);

        const delay = Math.min(Math.pow(2, connectionAttempts) * 1000, MAX_RETRY_INTERVAL);
        console.log(`🔄 Retrying in ${delay / 1000}s...`);
        setTimeout(() => attemptConnection(resolve), delay);
    }
}

export async function getPool(): Promise<sql.ConnectionPool> {
    if (pool && isConnected) {
        return pool;
    }
    throw new Error('MSSQL is not available');
}

export function isMssqlConnected(): boolean {
    return isConnected;
}

export default poolPromise;