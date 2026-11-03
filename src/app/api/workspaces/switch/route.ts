import { NextResponse } from 'next/server';

import { switchWorkspace } from '@server/services/workspace/switch-workspace';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== 'object' ||
      body === null ||
      !('workspaceId' in body) ||
      typeof body.workspaceId !== 'string' ||
      !body.workspaceId.trim()
    ) {
      return NextResponse.json(
        { error: 'A valid workspaceId is required.' },
        { status: 400 },
      );
    }

    const membership = await switchWorkspace(body.workspaceId);

    const response = NextResponse.json({
      workspace: membership.workspace,
    });

    response.cookies.set('active_workspace_id', membership.workspaceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required.') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 },
        );
      }

      if (error.name === 'WorkspaceSwitchError') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 },
        );
      }
    }

    console.error('Workspace switch failed:', error);

    return NextResponse.json(
      { error: 'Unable to switch workspace.' },
      { status: 500 },
    );
  }
}
