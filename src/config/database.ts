import sql from 'mssql'; // You can now use the standard 'mssql' package
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    user: process.env.DB_USER as string,       // SQL Username
    password: process.env.DB_PASSWORD as string, // SQL Password
    server: process.env.DB_SERVER as string,
    database: process.env.DB_NAME as string,
    options: {
        encrypt: true, // Use true if you're on Azure or have SSL enabled
        trustServerCertificate: true, // Change to false for production environments
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log(`✅ Connected to SQL Server via SQL Auth at ${process.env.DB_SERVER}`);
        return pool;
    })
    .catch(err => {
        console.error('❌ Database Connection Failed!', err);
        process.exit(1);
    });

export default poolPromise;