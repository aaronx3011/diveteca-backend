import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/auth';
import { SessionsService } from '../services/SessionsService';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; role: string };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyToken(token);
    const isValid = await SessionsService.isSessionValid(token);
    if (!isValid) {
      return res.status(401).json({ error: 'Unauthorized — session revoked or expired' });
    }
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Unauthorized — invalid token' });
  }
}
