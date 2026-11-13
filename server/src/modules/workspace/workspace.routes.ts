import { Router } from 'express';

import { getAuthContext } from '@server/shared/context/get-auth-context.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { authenticate } from '@server/shared/middleware/authenticate.js';
import { switchWorkspace } from '@server/modules/workspace/services/switch-workspace.js';
import { getUserWorkspaces } from '@server/modules/workspace/services/get-user-workspaces.js';
import { getCurrentWorkspace } from '@server/modules/workspace/services/get-current-workspace.js';
import { resolveExecutionContext } from '@server/modules/workspace/resolve-execution-context.js';
import { createWorkspace } from '@server/modules/workspace/services/create-workspace.js';
import { workspaceContext } from '@server/shared/middleware/workspace-context.js';
import { getWorkspaceMembers } from '@server/modules/workspace/services/get-workspace-members.js';
import { getWorkspaceInvitations } from './services/get-workspace-invitations.js';
import { createInvitation } from './services/create-invitation.js';
import { revokeInvitation } from './services/revoke-invitation.js';
import { changeMemberRole } from './services/change-member-role.js';
import { removeWorkspaceMember } from './services/remove-workspace-member.js';
import { resendInvitation } from './services/resend-invitation.js';
import { transferWorkspaceOwnership } from './services/transfer-workspace-ownership.js';
import { deleteWorkspace } from './services/delete-workspace.js';

const router = Router();

// All workspace routes require authentication.
router.use(authenticate);

// Change a workspace member's role.
// Only Owners can change roles. Ownership transfers use a separate endpoint.
router.patch('/:workspaceId/members/:membershipId/role', workspaceContext, async (req, res, next) => {
  try {
    const context = res.locals.executionContext;
    const membershipId = req.params.membershipId;
    const body: unknown = req.body;

    if (typeof membershipId !== 'string' || !membershipId.trim()) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A valid membershipId is required.', 400);
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      !('role' in body) ||
      (body.role !== 'ADMIN' && body.role !== 'MEMBER')
    ) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Role must be ADMIN or MEMBER.', 400);
    }

    const membership = await changeMemberRole(context, {
      membershipId,
      role: body.role,
    });

    res.status(200).json({ membership });
  } catch (error) {
    next(error);
  }
});

// Transfer workspace ownership.
// Only the current Owner can transfer ownership to another workspace member.
router.post('/:workspaceId/transfer-ownership', workspaceContext, async (req, res, next) => {
  try {
    const context = res.locals.executionContext;
    const body: unknown = req.body;

    if (
      typeof body !== 'object' ||
      body === null ||
      !('targetMembershipId' in body) ||
      typeof body.targetMembershipId !== 'string' ||
      !body.targetMembershipId.trim()
    ) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A valid targetMembershipId is required.', 400);
    }

    const result = await transferWorkspaceOwnership(context, {
      targetMembershipId: body.targetMembershipId,
    });

    res.status(200).json({
      message: 'Workspace ownership transferred successfully.',
      newOwner: result.newOwner,
      previousOwner: result.previousOwner,
    });
  } catch (error) {
    next(error);
  }
});

// Remove a member from the workspace.
// Only Owners can remove members. Owners cannot remove themselves or another Owner.
router.delete('/:workspaceId/members/:membershipId', workspaceContext, async (req, res, next) => {
  try {
    const context = res.locals.executionContext;
    const membershipId = req.params.membershipId;

    if (typeof membershipId !== 'string' || !membershipId.trim()) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A valid membershipId is required.', 400);
    }

    const membership = await removeWorkspaceMember(context, {
      membershipId,
    });

    res.status(200).json({
      message: 'Workspace member removed successfully.',
      membership: {
        id: membership.id,
        userId: membership.userId,
        role: membership.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// resend invitation
router.post('/:workspaceId/invitations/:invitationId/resend', workspaceContext, async (req, res, next) => {
  try {
    const context = res.locals.executionContext;
    const invitationId = req.params.invitationId;

    if (typeof invitationId !== 'string' || !invitationId.trim()) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A valid invitationId is required.', 400);
    }

    const result = await resendInvitation(context, {
      invitationId,
    });

    res.status(200).json({
      message: 'Invitation resent successfully.',
      invitation: {
        id: result.invitation.id,
        email: result.invitation.email,
        role: result.invitation.role,
        expiresAt: result.invitation.expiresAt,
      },
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
});

// delete workspace invitation
router.delete('/:workspaceId/invitations/:invitationId', workspaceContext, async (req, res, next) => {
  try {
    const context = res.locals.executionContext;
    const invitationId = req.params.invitationId;

    if (typeof invitationId !== 'string' || !invitationId.trim()) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A valid invitationId is required.', 400);
    }

    const invitation = await revokeInvitation(context, {
      invitationId,
    });

    res.status(200).json({
      message: 'Invitation revoked successfully.',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        revokedAt: invitation.revokedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create workspace invitation.
router.post('/:workspaceId/invitations', workspaceContext, async (req, res, next) => {
  try {
    const context = res.locals.executionContext;
    const body: unknown = req.body;

    if (
      typeof body !== 'object' ||
      body === null ||
      !('email' in body) ||
      typeof body.email !== 'string' ||
      !body.email.trim()
    ) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A valid email is required.', 400);
    }

    if (!('role' in body) || (body.role !== 'ADMIN' && body.role !== 'MEMBER')) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Role must be ADMIN or MEMBER.', 400);
    }

    const result = await createInvitation(context, {
      email: body.email,
      role: body.role,
    });

    res.status(201).json({
      invitation: {
        id: result.invitation.id,
        email: result.invitation.email,
        role: result.invitation.role,
        expiresAt: result.invitation.expiresAt,
        createdAt: result.invitation.createdAt,
      },
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
});

// get workspace invitations
router.get('/:workspaceId/invitations', workspaceContext, async (_req, res, next) => {
  try {
    const context = res.locals.executionContext;
    const invitations = await getWorkspaceInvitations(context);

    res.status(200).json({ invitations });
  } catch (error) {
    next(error);
  }
});

// Get workspace members
router.get('/:workspaceId/members', workspaceContext, async (_req, res, next) => {
  try {
    const context = res.locals.executionContext;
    const members = await getWorkspaceMembers(context);

    res.status(200).json({ members });
  } catch (error) {
    next(error);
  }
});

// Delete a workspace.
// Only the workspace Owner can delete it.
router.delete('/:workspaceId', workspaceContext, async (_req, res, next) => {
  try {
    const context = res.locals.executionContext;

    const workspace = await deleteWorkspace(context);

    res.status(200).json({
      message: 'Workspace deleted successfully.',
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create a new workspace.
router.post('/', async (req, res, next) => {
  try {
    const body: unknown = req.body;

    if (
      typeof body !== 'object' ||
      body === null ||
      !('name' in body) ||
      typeof body.name !== 'string' ||
      !body.name.trim()
    ) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A valid workspace name is required.', 400);
    }

    const authContext = getAuthContext(res);
    const activeWorkspaceId = req.cookies?.active_workspace_id;

    if (!activeWorkspaceId) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'An active workspace is required.', 400);
    }

    const context = await resolveExecutionContext({
      actor: authContext.actor,
      workspaceId: activeWorkspaceId,
      requestId: authContext.requestId,
    });

    const workspace = await createWorkspace(context, {
      name: body.name,
    });

    res.status(201).json({ workspace });
  } catch (error) {
    next(error);
  }
});

// Get the currently selected workspace.
router.get('/current', async (_req, res, next) => {
  try {
    const context = getAuthContext(res);
    const workspaceId = _req.cookies?.active_workspace_id;

    const membership = await getCurrentWorkspace(context, workspaceId);

    res.status(200).json({
      workspace: membership?.workspace ?? null,
      role: membership?.role ?? null,
    });
  } catch (error) {
    next(error);
  }
});

// Get all workspaces belonging to the authenticated user.
router.get('/', async (_req, res, next) => {
  try {
    const context = getAuthContext(res);
    const memberships = await getUserWorkspaces(context);

    res.status(200).json({
      workspaces: memberships,
    });
  } catch (error) {
    next(error);
  }
});

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
    next(error);
  }
});

// Workspace-scoped routes will be registered below.
// Apply workspaceContext to individual routes that require membership.

export default router;
