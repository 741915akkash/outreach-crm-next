import type { AuthenticatedContext } from '@server/shared/context/execution-context.js';
import { getWorkspaceMembership } from './get-workspace-membership.js';

export class WorkspaceSwitchError extends Error {
  constructor(message = 'You do not have access to this workspace.') {
    super(message);
    this.name = 'WorkspaceSwitchError';
  }
}

export async function switchWorkspace(context: AuthenticatedContext, workspaceId: string) {
  if (context.actor.type !== 'USER') {
    throw new WorkspaceSwitchError('Only users can switch workspaces.');
  }

  const membership = await getWorkspaceMembership(context.actor.id, workspaceId);

  if (!membership) {
    throw new WorkspaceSwitchError();
  }

  return membership;
}
