import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be configured in production');
}
const JWT_EXPIRES_IN = '24h';

export function signToken(payload: { userId: number; role: string }): string {
  return jwt.sign(payload, JWT_SECRET || 'development-only-secret', { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: number; role: string } {
  return jwt.verify(token, JWT_SECRET || 'development-only-secret') as { userId: number; role: string };
}
