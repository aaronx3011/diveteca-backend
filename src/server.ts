import app from './app';
import poolPromise from './config/database'; // initializes DB immediately

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', async () => {
    // Await the db connection to ensure it's up before serving
    await poolPromise;
    console.log(`🚀 Dashboard API Server is running on http://0.0.0.0:${PORT}`);
});