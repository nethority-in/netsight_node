import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { verifyToken } from '../services/twilioauthService.js';
import { findUserByApiKey } from '../services/twiliouserService.js';

dotenv.config();

const API_SECRET = process.env.API_SECRET;

export interface AuthPayload {
  id: string;
  username: string;
  source: 'jwt' | 'api_secret';
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthPayload;
    }
  }
}

//  Accepts: Authorization: Bearer <JWT>, or x-api-key: <user API key from register/login>, or x-api-key: <API_SECRET>.
export async function authenticateJWTOrApiSecret(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] as string | undefined;

    let token: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (token) {
      const jwtUser = verifyToken(token);
      if (jwtUser) {
        req.authUser = { id: jwtUser.id, username: jwtUser.username, source: 'jwt' };
        next();
        return;
      }
    }

    if (API_SECRET && apiKey && apiKey.trim() === API_SECRET.trim()) {
      req.authUser = { id: 'api', username: 'api', source: 'api_secret' };
      next();
      return;
    }

    if (apiKey && apiKey.trim()) {
      const userByKey = await findUserByApiKey(apiKey.trim());
      if (userByKey) {
        req.authUser = { id: userByKey.id, username: userByKey.username, source: 'api_secret' };
        next();
        return;
      }
    }

    res.status(401).json({
      ok: false,
      error: {
        message: 'Authentication required. Use Authorization: Bearer <JWT> or x-api-key: <your API key or API_SECRET>.',
        status: 401,
        code: 401
      }
    });
  } catch (err) {
    next(err);
  }
}
