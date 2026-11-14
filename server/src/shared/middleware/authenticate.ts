import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedContext } from '@server/shared/context/execution-context.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { getSession } from '@server/services/auth/get-session.js';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await getSession(req.headers);

    if (!session) {
      throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Authentication required.', 401);
    }

    const authContext: AuthenticatedContext = {
      actor: {
        type: 'USER',
        id: session.user.id,
      },
      requestId: res.locals.requestId,
    };

    res.locals.session = session;
    res.locals.authContext = authContext;

    next();
  } catch (error) {
    next(error);
  }
}
