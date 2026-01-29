import { Response } from 'express';

export interface ErrorResponse {
  ok: boolean;
  error: {
    message: string;
    status: number;
    code: number;
    details?: unknown;
  };
}

/** Result shape from WhatsApp/Email services: { ok, meta?|data?, error? } */
export interface ServiceResult {
  ok: boolean;
  meta?: unknown;
  data?: unknown;
  error?: { message: string; status: number; code: number; details?: unknown };
}

export class ErrorHandler {
  static sendErrorResponse(res: Response, error: unknown, defaultMessage: string = 'Unknown error', statusCode: number = 500): void {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    console.error(`Error: ${defaultMessage}`, error);

    res.status(statusCode).json({
      ok: false,
      error: {
        message: errorMessage,
        status: statusCode,
        code: statusCode
      }
    });
  }

  static sendValidationError(res: Response, message: string, missingFields?: string[]): void {
    res.status(400).json({
      ok: false,
      error: {
        message: missingFields ? `${message}: ${missingFields.join(', ')}` : message,
        status: 400,
        code: 400
      }
    });
  }

  static sendNotFoundError(res: Response, resource: string): void {
    res.status(404).json({
      ok: false,
      error: {
        message: `${resource} not found`,
        status: 404,
        code: 404
      }
    });
  }

  /** Send service result (WhatsApp/Email { ok, meta/data, error? }) with correct status. */
  static sendServiceResult(res: Response, result: ServiceResult): void {
    const statusCode = result.ok ? 200 : (result.error?.status ?? 500);
    res.status(statusCode).json(result);
  }

  /** Send success response. Payload can be { message, data, ... }; defaults to { ok: true }. */
  static sendSuccess(res: Response, payload?: Record<string, unknown>, status: number = 200): void {
    res.status(status).json(
      payload !== undefined && typeof payload === 'object'
        ? { ok: true, ...payload }
        : { ok: true }
    );
  }

    /** Send 429 Too Many Requests (rate limit / abuse). */
  static sendRateLimitExceeded(res: Response, message: string = 'Too many requests. Please try again later.', retryAfterSeconds?: number): void {
    if (retryAfterSeconds !== undefined) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
    }
    res.status(429).json({
      ok: false,
      error: {
        message,
        status: 429,
        code: 429
      }
    });
  }

  /** Send 503 Unavailable (e.g. database down). */
  static sendUnavailable(res: Response, message: string = 'Service temporarily unavailable'): void {
    res.status(503).json({
      ok: false,
      error: {
        message,
        status: 503,
        code: 503
      }
    });
  }

  /**
   * Build error result for services (no Response). Use when returning { ok: false, error } from service methods.
   * Keeps error shape consistent with ErrorResponse / ServiceResult.
   */
  static toServiceError(
    message: string,
    status: number = 500,
    code?: number,
    details?: unknown
  ): ErrorResponse {
    return {
      ok: false,
      error: {
        message,
        status,
        code: code ?? status,
        ...(details !== undefined && { details })
      }
    };
  }
}

export class AppError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number = 400, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}