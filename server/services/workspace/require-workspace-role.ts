import 'server-only';

import type { WorkspaceRole } from '@/generated/prisma/enums';
import { requireWorkspace } from './require-workspace';

export class ForbiddenError extends Error {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export async function requireWorkspaceRole(
  workspaceId: string,
  allowedRoles: WorkspaceRole[],
) {
  const context = await requireWorkspace(workspaceId);

  if (!allowedRoles.includes(context.membership.role)) {
    throw new ForbiddenError();
  }

  return context;
}
