import { Router } from 'express';

import workspaceRouter from '@server/modules/workspace/workspace.routes.js';
import invitationRouter from '@server/modules/invitation/invitation.routes.js';
import leadRouter from '@server/modules/lead/lead.routes.js';
import companyRouter from '@server/modules/company/company.routes.js';

const router = Router();

router.use('/workspaces', workspaceRouter);
router.use('/invitations', invitationRouter);
router.use('/workspaces/:workspaceId/leads', leadRouter);
router.use('/workspaces/:workspaceId/companies', companyRouter);

export default router;
