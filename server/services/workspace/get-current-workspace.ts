import 'server-only';

import { cookies } from 'next/headers';

import { getSession } from '@server/services/auth/get-session';
import { getWorkspaceMembership } from './get-workspace-membership';

export async function getCurrentWorkspace() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const cookieStore = await cookies();
  const workspaceId = cookieStore.get('active_workspace_id')?.value;

  if (!workspaceId) {
    return null;
  }

  return getWorkspaceMembership(session.user.id, workspaceId);
}
