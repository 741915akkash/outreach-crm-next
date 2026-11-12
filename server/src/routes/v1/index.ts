import { Router } from 'express';
import workspaceRouter from './workspace.routes.js'

const router = Router();

router.use('/workspaces', workspaceRouter)

export default router;
