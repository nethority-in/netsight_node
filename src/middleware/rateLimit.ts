import { Request, Response, NextFunction } from 'express';
import { ErrorHandler } from '../utils/errorHandler.js';

// In-memory store: key -> { count, resetAt } 
const store = new Map<string, { count: number; resetAt: number }>();

// Clean old entries periodically 
const WINDOW_MS = 60 * 1000; // 1 minute
const CLEAN_INTERVAL_MS = 60 * 1000; // clean every minute

function getKey(req: Request): string {
  const userId = (req as Request & { userId?: string }).userId;
  if (userId) return `user:${userId}`;
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress ?? 'unknown';
  return `ip:${ip}`;
}

function cleanup(): void {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetAt < now) store.delete(key);
  }
}
setInterval(cleanup, CLEAN_INTERVAL_MS);

export interface RateLimitOptions {
  // Max requests per window (default 20 for send endpoints) 
  maxRequests?: number;
  // Window in ms (default 60_000) 
  windowMs?: number;
}

// Rate limiting / abuse protection for email and WhatsApp send endpoints.
// Uses in-memory store keyed by IP or authenticated user ID.

export function createRateLimiter(options: RateLimitOptions = {}) {
  const { maxRequests = 20, windowMs = WINDOW_MS } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = getKey(req);
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      ErrorHandler.sendRateLimitExceeded(
        res,
        'Rate limit exceeded. Try again later.',
        Math.ceil((entry.resetAt - now) / 1000)
      );
      return;
    }

    next();
  };
}

// Pre-configured limiter for notification send routes (email/WhatsApp) 
export const notificationRateLimiter = createRateLimiter({ maxRequests: 20, windowMs: 60_000 });


