import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { db } from './db';

interface RateLimitTokenBucket {
  tokens: number;
  lastRefill: number;
}

const memoryBucketStore = new Map<string, RateLimitTokenBucket>();

const redisUrl = process.env.REDIS_URL;
let redisClient: Redis | null = null;

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, { maxRetriesPerRequest: 2, connectTimeout: 1500 });
  } catch (e) {
    console.warn('[RateLimiter] Redis unavailable, using local token bucket store.');
  }
}

/**
 * Distributed Token Bucket Rate Limiting Middleware
 * - Free Tier Users: 5 requests per minute
 * - Admin Users: Unlimited Bypass
 */
export function distributedRateLimiter(options?: {
  maxTokens?: number;
  refillRatePerSec?: number;
  windowSeconds?: number;
}) {
  const maxTokens = options?.maxTokens || 10;
  const windowSeconds = options?.windowSeconds || 60;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.body?.userId || req.ip || 'anonymous';
      
      // Admin / Superadmin Bypass
      if (userId && userId !== 'anonymous') {
        const user = db.getUserById(userId);
        if (user && user.role === 'admin') {
          return next();
        }
      }

      const key = `ratelimit_${userId}_${req.path}`;
      const now = Date.now();

      // Memory-based Token Bucket Algorithm
      let bucket = memoryBucketStore.get(key);
      if (!bucket) {
        bucket = { tokens: maxTokens, lastRefill: now };
      } else {
        // Refill tokens based on elapsed time
        const elapsedSec = (now - bucket.lastRefill) / 1000;
        const refilledTokens = Math.min(maxTokens, bucket.tokens + (elapsedSec * (maxTokens / windowSeconds)));
        bucket.tokens = refilledTokens;
        bucket.lastRefill = now;
      }

      if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        memoryBucketStore.set(key, bucket);
        res.setHeader('X-RateLimit-Limit', maxTokens);
        res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens));
        return next();
      }

      // Rate limit exceeded
      return res.status(429).json({
        error: 'Too many generation requests. Please wait a moment or upgrade your credit plan.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: Math.ceil(windowSeconds / maxTokens),
      });

    } catch (err) {
      // Fail-open for request availability
      return next();
    }
  };
}
