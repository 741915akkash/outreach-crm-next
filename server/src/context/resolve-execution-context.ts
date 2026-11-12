import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';
import { getWorkspaceMembership } from '../services/workspace/get-workspace-membership.js';

import type { Actor } from './actor.js';
import type { ExecutionContext } from './execution-context.js';

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
