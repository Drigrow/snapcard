import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserDB } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'snapcard-secret-auth-key-2026';
export const DEFAULT_TTL_DAYS = 30;

export interface TokenPayload {
  userId: string;
  username: string;
  role: 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload | null;
    }
  }
}

export class AuthService {
  /**
   * Generate signed JWT with custom TTL (e.g. 7, 30, 90, 365 days)
   */
  public static generateToken(payload: TokenPayload, ttlDays: number = DEFAULT_TTL_DAYS): string {
    const expiresIn = `${Math.max(1, ttlDays)}d`;
    return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
  }

  /**
   * Verify and decode JWT
   */
  public static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (e) {
      return null;
    }
  }

  /**
   * Extract token from cookies or Authorization header
   */
  public static extractToken(req: Request): string | null {
    // 1. Check cookies
    if (req.cookies && req.cookies.snapcard_token) {
      return req.cookies.snapcard_token;
    }

    // 2. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    return null;
  }
}

/**
 * Middleware: Optional Auth (sets req.user if authenticated, otherwise req.user = null)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = AuthService.extractToken(req);
  if (token) {
    const decoded = AuthService.verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
};

/**
 * Middleware: Require Admin (blocks guests with 401/403)
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const token = AuthService.extractToken(req);
  if (!token) {
    res.status(401).json({ error: '请先以管理员身份登录 (Admin login required)' });
    return;
  }

  const decoded = AuthService.verifyToken(token);
  if (!decoded || decoded.role !== 'admin') {
    res.status(403).json({ error: '权限不足，仅管理员可执行此操作 (Forbidden: Admin role required)' });
    return;
  }

  req.user = decoded;
  next();
};
