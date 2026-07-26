import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { SessionsService } from '../services/SessionsService';
import { ServiceUnavailableError } from '../utils/errors';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { username, email, password, fullName, role } = req.body;

      if (!username || !email || !password || !fullName) {
        return res.status(400).json({ error: 'Missing required fields: username, email, password, fullName' });
      }

      const result = await AuthService.register(
        username,
        email,
        password,
        fullName,
        role || 'viewer',
        req.ip,
        req.headers['user-agent']
      );

      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ServiceUnavailableError) {
        return res.status(503).json({ error: 'service_unavailable', message: error.message });
      }
      console.error('Registration error:', error);
      if (error.message?.includes('UNIQUE') || error.number === 2627) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Missing required fields: username, password' });
      }

      const result = await AuthService.login(
        username,
        password,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ServiceUnavailableError) {
        return res.status(503).json({ error: 'service_unavailable', message: error.message });
      }
      console.error('Login error:', error);
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const header = req.headers.authorization;
      const token = header?.split(' ')[1];
      if (token) {
        await SessionsService.revokeSession(token);
      }
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      const user = await AuthService.getMe(req.user.userId);
      res.status(200).json({ data: user });
    } catch (error: any) {
      if (error instanceof ServiceUnavailableError) {
        return res.status(503).json({ error: 'service_unavailable', message: error.message });
      }
      console.error('Get me error:', error);
      if (error.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async checkReset(req: Request, res: Response) {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: 'Missing username' });
      }
      const status = await AuthService.checkResetStatus(username);
      res.status(200).json(status);
    } catch (error: any) {
      if (error instanceof ServiceUnavailableError) {
        return res.status(503).json({ error: 'service_unavailable', message: error.message });
      }
      console.error('Check reset error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
