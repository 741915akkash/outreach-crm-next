import { Router } from 'express';

import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { authenticate } from '@server/shared/middleware/authenticate.js';
import { workspaceContext } from '@server/shared/middleware/workspace-context.js';

import { createCompanySchema } from './schemas/create-company.schema.js';
import { updateCompanySchema } from './schemas/update-company.schema.js';
import { listCompaniesQuerySchema } from './schemas/list-companies.schema.js';
import { companyParamsSchema } from './schemas/company-params.schema.js';

import { createCompany } from './services/create-company.js';
import { getCompany } from './services/get-company.js';
import { listCompanies } from './services/list-companies.js';
import { updateCompany } from './services/update-company.js';
import { deleteCompany } from './services/delete-company.js';

const router = Router({ mergeParams: true });

// All company routes require authentication and workspace membership.
router.use(authenticate);
router.use(workspaceContext);

// GET /api/v1/workspaces/:workspaceId/companies
router.get('/', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedQuery = listCompaniesQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid company query parameters.', 400);
    }

    const result = await listCompanies(context, parsedQuery.data);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/workspaces/:workspaceId/companies
router.post('/', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedBody = createCompanySchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid company data.', 400);
    }

    const company = await createCompany(context, parsedBody.data);

    res.status(201).json({
      data: company,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/workspaces/:workspaceId/companies/:companyId
router.get('/:companyId', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedParams = companyParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid company ID.', 400);
    }

    const { companyId } = parsedParams.data;

    const company = await getCompany(context, companyId);

    res.status(200).json({
      data: company,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/workspaces/:workspaceId/companies/:companyId
router.patch('/:companyId', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedParams = companyParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid company ID.', 400);
    }

    const parsedBody = updateCompanySchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid company data.', 400);
    }

    const { companyId } = parsedParams.data;

    const company = await updateCompany(context, companyId, parsedBody.data);

    res.status(200).json({
      data: company,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/workspaces/:workspaceId/companies/:companyId
router.delete('/:companyId', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedParams = companyParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid company ID.', 400);
    }

    const { companyId } = parsedParams.data;

    const result = await deleteCompany(context, companyId);

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
