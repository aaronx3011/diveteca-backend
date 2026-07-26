import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './routes/api.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Allow requests from your frontend Dashboard
app.use(express.json()); // Parse JSON body
app.use(morgan('dev')); // HTTP request logger

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', apiRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

export default app;