import { Router } from 'express';
import workspaceRouter from '@server/modules/workspace/workspace.routes.js';

const router = Router();

router.use('/workspaces', workspaceRouter);

export default router;
