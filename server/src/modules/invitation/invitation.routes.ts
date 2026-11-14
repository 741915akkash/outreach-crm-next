import { Router } from 'express';

import { getInvitationByToken } from '@server/modules/workspace/services/get-invitation-by-token.js';
import { authenticate } from '@server/shared/middleware/authenticate.js';
import { getAuthContext } from '@server/shared/context/get-auth-context.js';
import { acceptInvitation } from '@server/modules/workspace/services/accept-invitation.js';
import { AppError } from '@server/shared/errors/app-error.js';
import { ERROR_CODES } from '@server/shared/errors/error-codes.js';

const router = Router();

// Accept an invitation using its token.
// Requires authentication and a verified email matching the invitation email.
router.post('/accept', authenticate, async (req, res, next) => {
  try {
    const body: unknown = req.body;

    if (
      typeof body !== 'object' ||
      body === null ||
      !('token' in body) ||
      typeof body.token !== 'string' ||
      !body.token.trim()
    ) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'A valid invitation token is required.', 400);
    }

    const context = getAuthContext(res);

    const membership = await acceptInvitation(context, {
      token: body.token,
    });

    res.status(200).json({ membership });
  } catch (error) {
    next(error);
  }
});

// Get public invitation details using its token.
// No authentication required. Returns only valid, pending invitations.
router.get('/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await getInvitationByToken({ token });

    if (!invitation) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Invitation not found or expired.', 404);
    }

    res.status(200).json({ invitation });
  } catch (error) {
    next(error);
  }
});

export default router;
