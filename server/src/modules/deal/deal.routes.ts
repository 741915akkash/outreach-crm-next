import { Router } from 'express';

import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { authenticate } from '@server/shared/middleware/authenticate.js';
import { workspaceContext } from '@server/shared/middleware/workspace-context.js';

import { createDealSchema } from './schemas/create-deal.schema.js';
import { updateDealSchema } from './schemas/update-deal.schema.js';
import { listDealsQuerySchema } from './schemas/list-deals.schema.js';
import { dealParamsSchema } from './schemas/deal-params.schema.js';

import { createDeal } from './services/create-deal.js';
import { getDeal } from './services/get-deal.js';
import { listDeals } from './services/list-deals.js';
import { updateDeal } from './services/update-deal.js';
import { deleteDeal } from './services/delete-deal.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(workspaceContext);

// GET /api/v1/workspaces/:workspaceId/deals
router.get('/', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedQuery = listDealsQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid deal query parameters.', 400);
    }

    const result = await listDeals(context, parsedQuery.data);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/workspaces/:workspaceId/deals
router.post('/', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedBody = createDealSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid deal data.', 400);
    }

    const deal = await createDeal(context, parsedBody.data);

    res.status(201).json({
      data: deal,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/workspaces/:workspaceId/deals/:dealId
router.get('/:dealId', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedParams = dealParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid deal ID.', 400);
    }

    const deal = await getDeal(context, parsedParams.data.dealId);

    res.status(200).json({
      data: deal,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/workspaces/:workspaceId/deals/:dealId
router.patch('/:dealId', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedParams = dealParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid deal ID.', 400);
    }

    const parsedBody = updateDealSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid deal data.', 400);
    }

    const deal = await updateDeal(context, parsedParams.data.dealId, parsedBody.data);

    res.status(200).json({
      data: deal,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/workspaces/:workspaceId/deals/:dealId
router.delete('/:dealId', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedParams = dealParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid deal ID.', 400);
    }

    const result = await deleteDeal(context, parsedParams.data.dealId);

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
