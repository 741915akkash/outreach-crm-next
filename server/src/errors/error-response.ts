import type { NextFunction, Request, Response } from 'express';

import { AppError } from '@server/errors/app-error.js';
import { ERROR_CODES } from '@server/errors/error-codes.js';

export function errorHandler(error: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  const requestId = res.locals.requestId as string | undefined;

  if (error instanceof AppError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
      },
      ...(requestId && { requestId }),
    });

    return;
  }

  if (error instanceof Error) {
    console.error('Unexpected application error:', {
      requestId,
      errorName: error.name,
      message: error.message,
      stack: error.stack,
    });
  } else {
    console.error('Unexpected non-Error exception:', {
      requestId,
      error,
    });
  }

  res.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An unexpected error occurred.',
    },
    ...(requestId && { requestId }),
  });
}
