import { NextResponse } from 'next/server';

import { generateRequestId } from '@server/context/request-id';
import { AppError } from '@server/errors/app-error';
import { ERROR_CODES } from '@server/errors/error-codes';
import { createErrorResponse } from '@server/errors/error-response';
import { switchWorkspace } from '@server/services/workspace/switch-workspace';

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A valid JSON request body is required.', 400);
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      !('workspaceId' in body) ||
      typeof body.workspaceId !== 'string' ||
      !body.workspaceId.trim()
    ) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A valid workspaceId is required.', 400);
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
    // Preserve the existing service's error behavior during migration.
    if (error instanceof Error) {
      if (error.message === 'Authentication required.') {
        return createErrorResponse(
          new AppError(ERROR_CODES.UNAUTHENTICATED, 'Authentication required.', 401),
          requestId,
        );
      }

      if (error.name === 'WorkspaceSwitchError') {
        return createErrorResponse(new AppError(ERROR_CODES.FORBIDDEN, error.message, 403), requestId);
      }
    }

    return createErrorResponse(error, requestId);
  }
}
