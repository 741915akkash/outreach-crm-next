import 'server-only';

import { getSession } from '@server/services/auth/get-session';
import { getWorkspaceMembership } from './get-workspace-membership';

export async function getCurrentWorkspace() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return getWorkspaceMembership(session.user.id);
}
