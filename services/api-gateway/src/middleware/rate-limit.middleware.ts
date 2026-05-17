import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger.js';

type RateLimitStore = {
  init?: (options: { windowMs: number }) => void;
  increment: (key: string) => Promise<{ totalHits: number; resetTime: Date }>;
  decrement: (key: string) => Promise<void>;
  resetKey: (key: string) => Promise<void>;
  shutdown?: () => void;
};

type LocalHit = {
  totalHits: number;
  resetTime: Date;
};

const redisStoreEnabled = (process.env.RATE_LIMIT_STORE || '').toLowerCase() === 'redis';
const redisUrl = process.env.REDIS_URL || process.env.AZURE_REDIS_CONNECTION_STRING || '';
const fallbackHits = new Map<string, LocalHit>();

let redisClient: InstanceType<typeof Redis> | null = null;
let redisErrorLogged = false;

const getRedisClient = () => {
  if (!redisStoreEnabled || !redisUrl) return null;

  if (!redisClient) {
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      tls: redisUrl.startsWith('rediss://') || redisUrl.includes(':6380') ? {} : undefined,
    });

    redisClient.on('error', (error: unknown) => {
      if (!redisErrorLogged) {
        logger.warn('Redis rate-limit store unavailable; using process-local fallback', {
          error: error instanceof Error ? error.message : String(error),
        });
        redisErrorLogged = true;
      }
    });
  }

  return redisClient;
};

const fallbackIncrement = (key: string, windowMs: number) => {
  const now = Date.now();
  const current = fallbackHits.get(key);

  if (!current || current.resetTime.getTime() <= now) {
    const hit = { totalHits: 1, resetTime: new Date(now + windowMs) };
    fallbackHits.set(key, hit);
    return hit;
  }

  current.totalHits += 1;
  return current;
};

const createRedisRateLimitStore = (prefix: string, windowMs: number): RateLimitStore | undefined => {
  if (!redisStoreEnabled) return undefined;

  const redis = getRedisClient();
  if (!redis) {
    logger.warn('RATE_LIMIT_STORE=redis was set but REDIS_URL is missing; using in-memory rate limits');
    return undefined;
  }

  const keyFor = (key: string) => `avora:rate-limit:${prefix}:${key}`;

  return {
    async increment(key: string) {
      const redisKey = keyFor(key);

      try {
        const totalHits = await redis.incr(redisKey);
        if (totalHits === 1) {
          await redis.pexpire(redisKey, windowMs);
        }

        const ttl = await redis.pttl(redisKey);
        const resetTime = new Date(Date.now() + Math.max(ttl, 1));
        return { totalHits, resetTime };
      } catch {
        return fallbackIncrement(redisKey, windowMs);
      }
    },
    async decrement(key: string) {
      const redisKey = keyFor(key);
      try {
        const value = await redis.decr(redisKey);
        if (value <= 0) await redis.del(redisKey);
      } catch {
        const current = fallbackHits.get(redisKey);
        if (!current) return;
        current.totalHits -= 1;
        if (current.totalHits <= 0) fallbackHits.delete(redisKey);
      }
    },
    async resetKey(key: string) {
      const redisKey = keyFor(key);
      try {
        await redis.del(redisKey);
      } catch {
        fallbackHits.delete(redisKey);
      }
    },
    shutdown() {
      void redis.quit();
    },
  };
};

const rateLimitResponse = (source: string, windowMs: number) => (_req: Request, res: Response) => {
  const retryAfter = res.getHeader('Retry-After');
  const retryAfterMs =
    typeof retryAfter === 'number'
      ? retryAfter * 1000
      : typeof retryAfter === 'string' && !Number.isNaN(Number(retryAfter))
        ? Number(retryAfter) * 1000
        : windowMs;

  res.status(429).json({
    code: 'RATE_LIMITED',
    error: 'Rate limited',
    message: 'Too many requests. Please wait a moment before trying again.',
    retryAfterMs,
    source,
  });
};

const apiWindowMs = 15 * 60 * 1000;
const aiWindowMs = 60 * 1000;

const apiStore = createRedisRateLimitStore('api', apiWindowMs);
const aiStore = createRedisRateLimitStore('ai-route', aiWindowMs);
const aiActionStore = createRedisRateLimitStore('ai-action', aiWindowMs);

export const apiLimiter = rateLimit({
  windowMs: apiWindowMs,
  max: Number(process.env.API_RATE_LIMIT_MAX || 600),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse('api-gateway', apiWindowMs),
  ...(apiStore ? { store: apiStore as any } : {}),
});

export const aiRouteLimiter = rateLimit({
  windowMs: aiWindowMs,
  max: Number(process.env.AI_RATE_LIMIT_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse('ai-route', aiWindowMs),
  ...(aiStore ? { store: aiStore as any } : {}),
});

export const aiActionLimiter = rateLimit({
  windowMs: aiWindowMs,
  max: Number(process.env.AI_ACTION_RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse('ai-action', aiWindowMs),
  ...(aiActionStore ? { store: aiActionStore as any } : {}),
});

export const getRateLimitStoreStatus = () => ({
  configuredStore: redisStoreEnabled ? 'redis' : 'memory',
  activeStore: redisStoreEnabled && redisUrl ? 'redis' : 'memory',
  redisConfigured: Boolean(redisUrl),
  redisStatus: redisClient?.status || 'not-created',
});
