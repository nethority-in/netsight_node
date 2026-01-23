import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const CUSTOM_TOKEN = process.env.CUSTOM_TOKEN;

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // STRICT: CUSTOM_TOKEN must be configured in .env
  if (!CUSTOM_TOKEN || CUSTOM_TOKEN.trim() === '') {
    console.error('❌ CUSTOM_TOKEN not configured in .env - All API requests will be rejected');
    res.status(500).json({
      ok: false,
      error: {
        message: 'Server configuration error: CUSTOM_TOKEN is not configured. Please configure CUSTOM_TOKEN in .env file.',
        status: 500,
        code: 500
      }
    });
    return;
  }

  // Get token from Authorization header (Bearer token format) - STRICT: Only Bearer token accepted
  const authHeader = req.headers.authorization;
  
  let token: string | undefined;

  // Check Authorization header (Bearer token format) - MANDATORY
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // If no token provided - REJECT
  if (!token || token === '') {
    res.status(401).json({
      ok: false,
      error: {
        message: 'Authentication required. Please provide CUSTOM_TOKEN in Authorization header as: Authorization: Bearer <CUSTOM_TOKEN>',
        status: 401,
        code: 401
      }
    });
    return;
  }

  // Verify token matches - STRICT validation
  if (token !== CUSTOM_TOKEN.trim()) {
    res.status(403).json({
      ok: false,
      error: {
        message: 'Invalid authentication token. Token does not match CUSTOM_TOKEN.',
        status: 403,
        code: 403
      }
    });
    return;
  }

  // Token is valid, proceed to next middleware
  next();
};
