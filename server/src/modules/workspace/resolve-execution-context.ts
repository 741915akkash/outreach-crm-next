import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';
import { getWorkspaceMembership } from './services/get-workspace-membership.js';

import type { Actor } from '@server/shared/context/actor.js';
import type { ExecutionContext } from '@server/shared/context/execution-context.js';

type ResolveExecutionContextInput = {
  actor: Actor;
  workspaceId: string;
  requestId: string;
};

export async function resolveExecutionContext({
  actor,
  workspaceId,
  requestId,
}: ResolveExecutionContextInput): Promise<ExecutionContext> {
  if (actor.type !== 'USER') {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'This actor type cannot access workspaces yet.', 403);
  }

  const membership = await getWorkspaceMembership(actor.id, workspaceId);

  if (!membership) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'You do not have access to this workspace.', 403);
  }

  return {
    actor,
    workspace: {
      workspaceId: membership.workspaceId,
      role: membership.role,
    },
    requestId,
  };
}
