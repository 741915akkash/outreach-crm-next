import 'server-only';

import { AppError } from '@server/errors/app-error';
import { ERROR_CODES } from '@server/errors/error-codes';
import { getSession } from '@server/services/auth/get-session';
import { getWorkspaceMembership } from '@server/services/workspace/get-workspace-membership';

import type { ExecutionContext } from './execution-context';

type ResolveExecutionContextInput = {
  workspaceId: string;
  requestId: string;
};

export async function resolveExecutionContext({
  workspaceId,
  requestId,
}: ResolveExecutionContextInput): Promise<ExecutionContext> {
  // 1. Resolve authenticated user
  const session = await getSession();

  if (!session) {
    throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Authentication required.', 401);
  }

  // 2. Verify workspace membership
  const membership = await getWorkspaceMembership(session.user.id, workspaceId);

  if (!membership) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'You do not have access to this workspace.', 403);
  }

  // 3. Construct trusted execution context
  return {
    actor: {
      type: 'USER',
      id: session.user.id,
    },
    workspace: {
      workspaceId: membership.workspaceId,
      role: membership.role,
    },
    requestId,
  };
}
