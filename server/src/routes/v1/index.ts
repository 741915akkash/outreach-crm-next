import { Router } from 'express';

import workspaceRouter from '@server/modules/workspace/workspace.routes.js';
import invitationRouter from '@server/modules/invitation/invitation.routes.js';

const router = Router();

router.use('/workspaces', workspaceRouter);
router.use('/invitations', invitationRouter);

export default router;
