// src/setupTests.ts
import sql from 'mssql/msnodesqlv8'; // <-- ADD THIS LINE
import { Server } from 'http';
import app from './app'; // Import your Express app
import poolPromise from './config/database'; // Import your database pool

let server: Server;
let dbPool: sql.ConnectionPool;

// Define a global variable for the pool so tests can access it
declare global {
    var __dbPool: sql.ConnectionPool;
}

beforeAll(async () => {
    // Start your Express server
    server = app.listen(process.env.PORT || 3000);
    
    // Establish a database connection
    dbPool = await poolPromise;
    global.__dbPool = dbPool; // Make it globally available for tests

    console.log('----------------------------------------------------------');
    console.log('Test Server and DB connection started for tests.');
    console.log(`Test Server running on port ${process.env.PORT || 3000}`);
    console.log('----------------------------------------------------------');
});

afterAll(async () => {
    // Close the database connection
    if (dbPool) {
        await dbPool.close();
        console.log('----------------------------------------------------------');
        console.log('Test DB connection closed.');
        console.log('----------------------------------------------------------');
    }
    // Close the Express server
    if (server) {
        server.close();
        console.log('Test Server closed.');
    }
});

// Optional: If you need to clean up data between tests (e.g., reset counts)
// beforeEach(async () => {
//   // Add cleanup logic here if needed
// });