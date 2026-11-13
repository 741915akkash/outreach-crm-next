import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedContext } from '@server/shared/context/execution-context.js';
import { resolveExecutionContext } from '@server/modules/workspace/resolve-execution-context.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export async function workspaceContext(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authContext = res.locals.authContext as AuthenticatedContext | undefined;

    const workspaceIdParam = req.params.workspaceId;

    const workspaceId = typeof workspaceIdParam === 'string' ? workspaceIdParam : undefined;

    if (!authContext) {
      throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Authentication required.', 401);
    }

    if (!workspaceId) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A workspace ID is required.', 400);
    }

    const context = await resolveExecutionContext({
      actor: authContext.actor,
      workspaceId,
      requestId: authContext.requestId,
    });

    res.locals.executionContext = context;

    next();
  } catch (error) {
    next(error);
  }
}
