import 'server-only';

import { getSession } from '@server/services/auth/get-session';
import { getWorkspaceMembership } from './get-workspace-membership';

export class UnauthenticatedError extends Error {
  constructor() {
    super('Authentication required');
    this.name = 'UnauthenticatedError';
  }
}

export class WorkspaceMembershipRequiredError extends Error {
  constructor() {
    super('Workspace membership required');
    this.name = 'WorkspaceMembershipRequiredError';
  }
}

export async function requireWorkspace() {
  const session = await getSession();

  if (!session) {
    throw new UnauthenticatedError();
  }

  const membership = await getWorkspaceMembership(session.user.id);

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
