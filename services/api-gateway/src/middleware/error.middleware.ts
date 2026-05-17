import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  retryAfterMs?: number;
  source?: string;

  constructor(
    message: string,
    statusCode: number,
    options: { code?: string; retryAfterMs?: number; source?: string } = {}
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = options.code;
    this.retryAfterMs = options.retryAfterMs;
    this.source = options.source;
    Error.captureStackTrace(this, this.constructor);
  }
}

type StructuredError = Error & {
  statusCode?: number;
  code?: string;
  retryAfterMs?: number;
  source?: string;
  provider?: string;
  isOperational?: boolean;
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};

export const errorHandler = (
  err: StructuredError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err instanceof AppError
    ? err.statusCode
    : typeof err.statusCode === 'number'
      ? err.statusCode
      : null;

  if (statusCode) {
    logger.error(`${statusCode} - ${err.message}`, {
      stack: err.stack,
      code: err.code,
      source: err.source,
      retryAfterMs: err.retryAfterMs,
    });
    return res.status(statusCode).json({
      error: err.message,
      message: err.message,
      statusCode,
      ...(err.code ? { code: err.code } : {}),
      ...(err.retryAfterMs !== undefined ? { retryAfterMs: err.retryAfterMs } : {}),
      ...(err.source ? { source: err.source } : {}),
      ...(err.provider ? { provider: err.provider } : {}),
    });
  }

  logger.error('Internal Server Error', { stack: err.stack });
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
