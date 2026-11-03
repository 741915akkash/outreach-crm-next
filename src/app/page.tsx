import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const instant = false;

import { getSession } from '@server/services/auth/get-session';
import { getWorkspaceMembership } from '@server/services/workspace/get-workspace-membership';
import { getUserWorkspaces } from '@server/services/workspace/get-user-workspaces';

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const cookieStore = await cookies();
  const activeWorkspaceId = cookieStore.get('active_workspace_id')?.value;

  if (activeWorkspaceId) {
    const membership = await getWorkspaceMembership(
      session.user.id,
      activeWorkspaceId,
    );

    if (membership) {
      redirect(`/workspaces/${membership.workspaceId}/dashboard`);
    }
  }

  const memberships = await getUserWorkspaces(session.user.id);

  if (memberships.length === 0) {
    redirect('/onboarding');
  }

  redirect(`/workspaces/${memberships[0].workspaceId}/dashboard`);
}
