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
}
