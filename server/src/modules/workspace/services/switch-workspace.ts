import type { AuthenticatedContext } from '@server/shared/context/execution-context.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { getWorkspaceMembership } from './get-workspace-membership.js';

export async function switchWorkspace(context: AuthenticatedContext, workspaceId: string) {
  if (context.actor.type !== 'USER') {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'Only users can switch workspaces.', 403);
  }

  const membership = await getWorkspaceMembership(context.actor.id, workspaceId);

  if (!membership) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'You do not have access to this workspace.', 403);
  }

  return membership;
}
