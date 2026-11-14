import type { Response } from 'express';

import type { AuthenticatedContext } from './execution-context.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export function getAuthContext(res: Response): AuthenticatedContext {
  const context = res.locals.authContext as AuthenticatedContext | undefined;

  if (!context) {
    throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Authentication required.', 401);
  }

  return context;
}
