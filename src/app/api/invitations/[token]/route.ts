import { NextResponse } from 'next/server';

import { generateRequestId } from '@server/context/request-id';
import { AppError } from '@server/errors/app-error';
import { ERROR_CODES } from '@server/errors/error-codes';
import { createErrorResponse } from '@server/errors/error-response';
import { getInvitationByToken } from '@server/services/workspace/get-invitation-by-token';

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();

  try {
    const { token } = await params;

    const invitation = await getInvitationByToken({ token });

    if (!invitation) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Invitation is invalid or no longer active.', 404);
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    return createErrorResponse(error, requestId);
  }
}
