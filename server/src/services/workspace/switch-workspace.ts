import { getSession } from '@server/services/auth/get-session.js';
import { getWorkspaceMembership } from './get-workspace-membership.js';

export class WorkspaceSwitchError extends Error {
  constructor(message = 'You do not have access to this workspace.') {
    super(message);
    this.name = 'WorkspaceSwitchError';
  }
}

export async function switchWorkspace(workspaceId: string) {
  const session = await getSession();

  if (!session) {
    throw new Error('Authentication required.');
  }

  const membership = await getWorkspaceMembership(session.user.id, workspaceId);

  if (!membership) {
    throw new WorkspaceSwitchError();
  }

  return membership;
}
