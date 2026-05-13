import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { AppError } from './error.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

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

const getSupabaseAdmin = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return null;
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  return supabaseAdmin;
};

const verifySupabaseToken = async (token: string): Promise<AuthUser | null> => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return {
    userId: data.user.id,
    email: data.user.email || '',
  };
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
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
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
    next();
  }
};
