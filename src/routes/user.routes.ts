import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.get('/', UserController.getAll);

export default router;
