import type { AuthenticatedContext } from '@server/shared/context/execution-context.js';
import { requireWorkspace } from './require-workspace.js';

export async function getCurrentWorkspace(context: AuthenticatedContext, workspaceId?: string) {
  if (!workspaceId) {
    return null;
  }

  return requireWorkspace(context, workspaceId);
}
