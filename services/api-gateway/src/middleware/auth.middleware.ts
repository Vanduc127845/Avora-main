import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware.js';
import { getOptionalSupabaseAuthClient, isDemoDataMode } from '../utils/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

type DecodedAuthToken = {
  sub?: unknown;
  userId?: unknown;
  email?: unknown;
};

const decodeDemoAuthToken = (token: string): AuthUser | null => {
  if (!isDemoDataMode()) return null;

  const decoded = jwt.decode(token) as DecodedAuthToken | string | null;
  if (!decoded || typeof decoded === 'string') return null;

  const userId =
    typeof decoded.userId === 'string'
      ? decoded.userId
      : typeof decoded.sub === 'string'
        ? decoded.sub
        : null;

  if (!userId) return null;

  return {
    userId,
    email: typeof decoded.email === 'string' ? decoded.email : '',
  };
};

const verifySupabaseToken = async (token: string): Promise<AuthUser | null> => {
  if (isDemoDataMode()) return decodeDemoAuthToken(token);

  const supabase = getOptionalSupabaseAuthClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;

    return {
      userId: data.user.id,
      email: data.user.email || '',
    };
  } catch {
    return null;
  }
};

const verifyLocalJwt = (token: string): AuthUser => {
  return jwt.verify(token, JWT_SECRET) as AuthUser;
};

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authorization token required', 401);
    }

    const token = authHeader.substring(7);
    const supabaseUser = await verifySupabaseToken(token);
    req.user = supabaseUser || verifyLocalJwt(token);
    next();
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    if (error instanceof jwt.JsonWebTokenError || name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError || name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      req.user = (await verifySupabaseToken(token)) || verifyLocalJwt(token);
    }
    next();
  } catch {
    next(); // optionalAuth never blocks
  }
};
