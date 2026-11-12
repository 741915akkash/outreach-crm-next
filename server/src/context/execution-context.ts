import type { Actor } from './actor.js';
import type { WorkspaceContext } from './workspace-context.js';

export type ExecutionContext = {
  actor: Actor;
  workspace: WorkspaceContext;
  requestId: string;
  initiatedByUserId?: string;
};
