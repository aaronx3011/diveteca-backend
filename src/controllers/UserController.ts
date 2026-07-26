import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

export class UserController {
  static async getAll(req: Request, res: Response) {
    try {
      const users = await UserService.getAll();
      res.status(200).json({ data: users });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
