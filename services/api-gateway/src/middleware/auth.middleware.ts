import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createPublicKey, type JsonWebKey } from 'crypto';
import { AppError } from './error.middleware.js';
import { getOptionalSupabaseAuthClient, isDemoDataMode } from '../utils/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SUPABASE_URL = process.env.SUPABASE_URL || '';

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

// JWKS cache: keyed by `kid` (Key ID), value is PEM-encoded public key.
const jwksCache = {
  keys: new Map<string, string>(),
  expiresAt: 0,
};

// Fetch Supabase JWKS once per hour and cache the public keys locally.
// This handles both current ECC (P-256) tokens and any future key formats
// without any per-request HTTP call after the first warm-up.
const refreshJwks = async (): Promise<void> => {
  if (!SUPABASE_URL || Date.now() < jwksCache.expiresAt) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
    if (!res.ok) return;
    const body = (await res.json()) as { keys?: JsonWebKey[] };
    if (!Array.isArray(body.keys)) return;

    const next = new Map<string, string>();
    for (const jwk of body.keys) {
      try {
        const pub = createPublicKey({ key: jwk, format: 'jwk' });
        const kid = (jwk as { kid?: string }).kid ?? '';
        next.set(kid, pub.export({ type: 'spki', format: 'pem' }) as string);
      } catch {
        // Skip unrecognised key types
      }
    }
    if (next.size > 0) {
      jwksCache.keys = next;
      jwksCache.expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    }
  } catch {
    // Network errors are non-fatal; fall back to Supabase API call
  }
};

// Verify a Supabase-issued JWT locally using cached JWKS public keys.
// Supports ES256 (current default) and RS256. No per-request HTTP overhead
// once the cache is warm (refreshed hourly).
const verifyWithJwks = async (token: string): Promise<AuthUser | null> => {
  if (!SUPABASE_URL) return null;
  await refreshJwks();
  if (jwksCache.keys.size === 0) return null;

  const header = jwt.decode(token, { complete: true })?.header;
  const kid = typeof header?.kid === 'string' ? header.kid : '';

  // Prefer the key that matches the token's kid; fall back to trying all keys.
  const candidates =
    kid && jwksCache.keys.has(kid)
      ? [jwksCache.keys.get(kid)!]
      : [...jwksCache.keys.values()];

  for (const pem of candidates) {
    try {
      const payload = jwt.verify(token, pem, {
        algorithms: ['ES256', 'RS256'],
      }) as { sub?: string; email?: string; role?: string };
      if (!payload.sub || payload.role !== 'authenticated') return null;
      return { userId: payload.sub, email: payload.email || '' };
    } catch {
      // Wrong key or bad signature — try next candidate
    }
  }
  return null;
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

  // Fast path: verify locally with cached JWKS keys — no HTTP call per request.
  const localUser = await verifyWithJwks(token);
  if (localUser) return localUser;

  // Slow path: call Supabase API (used on first request or when JWKS is unreachable).
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
