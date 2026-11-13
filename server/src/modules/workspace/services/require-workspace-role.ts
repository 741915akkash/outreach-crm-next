import type { WorkspaceRole } from '@/generated/prisma/enums.js';
import type { ExecutionContext } from '@server/shared/context/execution-context.js';

export class ForbiddenError extends Error {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export function requireWorkspaceRole(context: ExecutionContext, allowedRoles: WorkspaceRole[]): void {
  if (!allowedRoles.includes(context.workspace.role)) {
    throw new ForbiddenError();
  }
}
