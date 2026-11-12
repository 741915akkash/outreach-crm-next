
import type { NextFunction, Request, Response } from 'express';

import { AppError } from '@server/errors/app-error.js';
import { ERROR_CODES } from '@server/errors/error-codes.js';
import { getSession } from '@server/services/auth/get-session.js';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await getSession(req.headers);

    if (!session) {
      throw new AppError(
        ERROR_CODES.UNAUTHENTICATED,
        'Authentication required.',
        401,
      );
    }

    res.locals.session = session;
    res.locals.actor = {
      type: 'USER',
      id: session.user.id,
    };

    next();
  } catch (error) {
    next(error);
  }
}
