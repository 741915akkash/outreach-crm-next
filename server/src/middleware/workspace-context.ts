import type { NextFunction, Request, Response } from 'express';

import type { Actor } from '@server/context/actor.js';
import { resolveExecutionContext } from '@server/context/resolve-execution-context.js';
import { AppError } from '@server/errors/app-error.js';
import { ERROR_CODES } from '@server/errors/error-codes.js';

export async function workspaceContext(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = res.locals.actor as Actor | undefined;
    const requestId = res.locals.requestId as string | undefined;
    const workspaceIdParam = req.params.workspaceId;

    const workspaceId = typeof workspaceIdParam === 'string' ? workspaceIdParam : undefined;

    if (!actor) {
      throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Authentication required.', 401);
    }

    if (!requestId) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Request context is unavailable.', 500);
    }

    if (!workspaceId) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A workspace ID is required.', 400);
    }

    const context = await resolveExecutionContext({
      actor,
      workspaceId,
      requestId,
    });

    res.locals.executionContext = context;

    next();
  } catch (error) {
    next(error);
  }
}
