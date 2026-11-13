import type { AuthenticatedContext } from '@server/shared/context/execution-context.js';
import { getWorkspaceMembership } from './get-workspace-membership.js';

export class UnauthenticatedError extends Error {
  constructor() {
    super('Authentication required.');
    this.name = 'UnauthenticatedError';
  }
}

export class WorkspaceMembershipRequiredError extends Error {
  constructor() {
    super('You do not have access to this workspace.');
    this.name = 'WorkspaceMembershipRequiredError';
  }
}

export async function requireWorkspace(context: AuthenticatedContext, workspaceId: string) {
  if (context.actor.type !== 'USER') {
    throw new UnauthenticatedError();
  }

  const membership = await getWorkspaceMembership(context.actor.id, workspaceId);

  if (!membership) {
    throw new WorkspaceMembershipRequiredError();
  }

  return membership;
}
