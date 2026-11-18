import { Router } from 'express';

import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { authenticate } from '@server/shared/middleware/authenticate.js';
import { workspaceContext } from '@server/shared/middleware/workspace-context.js';

import { createTaskSchema } from './schemas/create-task.schema.js';
import { updateTaskSchema } from './schemas/update-task.schema.js';
import { listTasksQuerySchema } from './schemas/list-tasks.schema.js';
import { taskParamsSchema } from './schemas/task-params.schema.js';

import { createTask } from './services/create-task.js';
import { getTask } from './services/get-task.js';
import { listTasks } from './services/list-tasks.js';
import { updateTask } from './services/update-task.js';
import { deleteTask } from './services/delete-task.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(workspaceContext);

// GET /api/v1/workspaces/:workspaceId/tasks
router.get('/', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedQuery = listTasksQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid task query parameters.', 400);
    }

    const result = await listTasks(context, parsedQuery.data);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/workspaces/:workspaceId/tasks
router.post('/', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedBody = createTaskSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid task data.', 400);
    }

    const task = await createTask(context, parsedBody.data);

    res.status(201).json({
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/workspaces/:workspaceId/tasks/:taskId
router.get('/:taskId', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedParams = taskParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid task ID.', 400);
    }

    const task = await getTask(context, parsedParams.data.taskId);

    res.status(200).json({
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/workspaces/:workspaceId/tasks/:taskId
router.patch('/:taskId', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedParams = taskParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid task ID.', 400);
    }

    const parsedBody = updateTaskSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid task data.', 400);
    }

    const task = await updateTask(context, parsedParams.data.taskId, parsedBody.data);

    res.status(200).json({
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/workspaces/:workspaceId/tasks/:taskId
router.delete('/:taskId', async (req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const parsedParams = taskParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid task ID.', 400);
    }

    const result = await deleteTask(context, parsedParams.data.taskId);

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
