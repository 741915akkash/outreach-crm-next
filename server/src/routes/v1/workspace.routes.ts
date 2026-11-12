import { Router } from 'express';

import { getAuthContext } from '@server/context/get-auth-context.js';
import { AppError } from '@server/errors/app-error.js';
import { ERROR_CODES } from '@server/errors/error-codes.js';
import { authenticate } from '@server/middleware/authenticate.js';
import { switchWorkspace, WorkspaceSwitchError } from '@server/services/workspace/switch-workspace.js';

const router = Router();

// All workspace routes require authentication.
router.use(authenticate);

// Switch the active workspace.
router.post('/switch', async (req, res, next) => {
  try {
    const body: unknown = req.body;

    if (
      typeof body !== 'object' ||
      body === null ||
      !('workspaceId' in body) ||
      typeof body.workspaceId !== 'string' ||
      !body.workspaceId.trim()
    ) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A valid workspaceId is required.', 400);
    }

    const context = getAuthContext(res);
    const membership = await switchWorkspace(context, body.workspaceId);

    res.cookie('active_workspace_id', membership.workspaceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.status(200).json({
      workspace: membership.workspace,
    });
  } catch (error) {
    if (error instanceof WorkspaceSwitchError) {
      next(new AppError(ERROR_CODES.FORBIDDEN, error.message, 403));
      return;
    }

    next(error);
  }
});

// Workspace-scoped routes will be registered below.
// Apply workspaceContext to individual routes that require membership.

export default router;
