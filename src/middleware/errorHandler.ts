import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  const statusCode = err instanceof AppError ? err.status : 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    ok: false,
    error: {
      message,
      status: statusCode,
      code: statusCode,
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    ok: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      status: 404,
      code: 404
    }
  });
};
