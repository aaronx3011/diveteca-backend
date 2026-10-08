import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import apiRoutes from './routes/api.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { HealthController } from './controllers/HealthController';
import { CacheService } from './services/CacheService';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use((req, res, next) => CacheService.runWithRequestContext(next));

// Routes
app.get('/api/health', HealthController.status);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', apiRoutes);

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(publicPath, 'index.html'));
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

export default app;
