import { NextResponse } from 'next/server';

import { getInvitationByToken } from '@server/services/workspace/get-invitation-by-token';

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { token } = await params;

    const invitation = await getInvitationByToken({ token });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation is invalid or no longer active.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Failed to retrieve invitation:', error);

    return NextResponse.json(
      { error: 'Unable to retrieve invitation.' },
      { status: 500 },
    );
  }
}
