import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { CacheService } from '../services/CacheService';

export class UserController {
  static async getAll(req: Request, res: Response) {
    try {
      const users = await UserService.getAll();
      if (CacheService.lastHitWasStale) {
        res.setHeader('X-Cache-Stale', 'true');
        CacheService.lastHitWasStale = false;
      }
      res.status(200).json({ data: users });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
