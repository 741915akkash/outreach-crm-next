import { getSession } from '@server/services/auth/get-session.js';
import { getWorkspaceMembership } from './get-workspace-membership.js';

export class UnauthenticatedError extends Error {
  constructor() {
    super('Authentication required');
    this.name = 'UnauthenticatedError';
  }
}

export class WorkspaceMembershipRequiredError extends Error {
  constructor() {
    super('You do not have access to this workspace.');
    this.name = 'WorkspaceMembershipRequiredError';
  }
}

export async function requireWorkspace(workspaceId: string) {
  const session = await getSession();

  if (!session) {
    throw new UnauthenticatedError();
  }

  const membership = await getWorkspaceMembership(session.user.id, workspaceId);

  if (!membership) {
    throw new WorkspaceMembershipRequiredError();
  }

  return {
    user: session.user,
    session: session.session,
    membership,
    workspace: membership.workspace,
  };
}
