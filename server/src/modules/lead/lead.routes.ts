import { Router } from 'express';

import { listLeadsQuerySchema } from './schemas/list-leads.schema.js';
import { listLeads } from './services/list-leads.js';

import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { authenticate } from '@server/shared/middleware/authenticate.js';
import { workspaceContext } from '@server/shared/middleware/workspace-context.js';
import { createLeadSchema } from './schemas/create-lead.schema.js';
import { createLead } from './services/create-lead.js';
import { getLead } from './services/get-lead.js';
import { updateLeadSchema } from './schemas/update-lead.schema.js';
import { updateLead } from './services/update-lead.js';
import { deleteLead } from './services/delete-lead.js';

import { leadParamsSchema } from './schemas/lead-params.schema.js';

const router = Router({ mergeParams: true });

// All lead routes require authentication and workspace membership.
router.use(authenticate);
router.use(workspaceContext);

// GET /api/v1/workspaces/:workspaceId/leads
router.get('/', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedQuery = listLeadsQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid lead query parameters.', 400);
    }

    const result = await listLeads(context, parsedQuery.data);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/workspaces/:workspaceId/leads
router.post('/', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedBody = createLeadSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid lead data.', 400);
    }

    const lead = await createLead(context, parsedBody.data);

    res.status(201).json({
      data: lead,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/workspaces/:workspaceId/leads/:leadId
router.get('/:leadId', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;
    const parsedParams = leadParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid lead ID.', 400);
    }

    const { leadId } = parsedParams.data;

    const lead = await getLead(context, leadId);

    res.status(200).json({
      data: lead,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/workspaces/:workspaceId/leads/:leadId
router.patch('/:leadId', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;
    const parsedParams = leadParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid lead ID.', 400);
    }

    const { leadId } = parsedParams.data;

    const parsedBody = updateLeadSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid lead data.', 400);
    }

    const lead = await updateLead(context, leadId, parsedBody.data);

    res.status(200).json({
      data: lead,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/workspaces/:workspaceId/leads/:leadId
router.delete('/:leadId', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;
    const parsedParams = leadParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid lead ID.', 400);
    }

    const { leadId } = parsedParams.data;

    const result = await deleteLead(context, leadId);

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
