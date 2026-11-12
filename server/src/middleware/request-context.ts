import type { NextFunction, Request, Response } from 'express';

import { generateRequestId } from '@server/context/request-id.js';

export function requestContext(_req: Request, res: Response, next: NextFunction): void {
  const requestId = generateRequestId();

  res.locals.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
}
