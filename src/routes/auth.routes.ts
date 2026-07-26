import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authMiddleware, AuthController.me);
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/check-reset', AuthController.checkReset);

export default router;
