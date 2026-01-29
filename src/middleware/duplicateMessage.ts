import { Request, Response, NextFunction } from 'express';
import { ErrorHandler } from '../utils/errorHandler.js';

interface CachedResponse {
  statusCode: number;
  body: Record<string, unknown>;
  createdAt: number;
}

// In-memory duplicate message store: duplicateMessageKey -> CachedResponse. TTL 1 hour. 
const store = new Map<string, CachedResponse>();
const TTL_MS = 1 * 60 * 60 * 1000; // 1 hour
const CLEAN_INTERVAL_MS = 20 * 60 * 1000; // clean every 20 minutes

// WHY WE RUN CLEAN_INTERVAL_MS? BECAUSE WE WANT TO CLEAN UP THE STORE EVERY HOUR TO PREVENT MEMORY LEAK.


function cleanup(): void {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.createdAt + TTL_MS < now) store.delete(key);
  }
}
setInterval(cleanup, CLEAN_INTERVAL_MS);

const DUPLICATE_MESSAGE_HEADER = 'duplicate-message-key';

// Duplicate message send protection.
// If request has header "Duplicate-Message-Key" and we've seen it before within TTL,
// return the cached response without calling next (no duplicate send).

export function duplicateMessageMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers[DUPLICATE_MESSAGE_HEADER];
  const duplicateMessageKey = typeof key === 'string' ? key.trim() : undefined;

  if (!duplicateMessageKey) {
    next();
    return;
  }

  const cached = store.get(duplicateMessageKey);
  if (cached) {
    res.status(cached.statusCode).json(cached.body);
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = (body: unknown): Response => {
    const statusCode = res.statusCode;
    if (statusCode >= 200 && statusCode < 300) {
      const bodyObj = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : { ok: true };
      store.set(duplicateMessageKey, { statusCode, body: bodyObj, createdAt: Date.now() });
    }
    return originalJson(body);
  };

  next();
}
