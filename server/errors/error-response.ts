import { NextResponse } from 'next/server';

import { AppError } from './app-error';
import { ERROR_CODES } from './error-codes';

export function createErrorResponse(error: unknown, requestId?: string) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
        ...(requestId && { requestId }),
      },
      { status: error.status },
    );
  }

  // Log detailed error information internally.
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

  // Return a safe response to the API client.
  return NextResponse.json(
    {
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An unexpected error occurred.',
      },
      ...(requestId && { requestId }),
    },
    { status: 500 },
  );
}
