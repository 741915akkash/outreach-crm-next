import type { WorkspaceRole } from '@/generated/prisma/enums.js';
import type { ExecutionContext } from '@server/shared/context/execution-context.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

export function requireWorkspaceRole(context: ExecutionContext, allowedRoles: WorkspaceRole[]): void {
  if (!allowedRoles.includes(context.workspace.role)) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'You do not have permission to perform this action.', 403);
  }
}
