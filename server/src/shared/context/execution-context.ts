import type { Actor } from './actor.js';
import type { WorkspaceContext } from './workspace-context.js';

export type AuthenticatedContext = {
  actor: Actor;
  requestId: string;
  initiatedByUserId?: string;
};

export type ExecutionContext = AuthenticatedContext & {
  workspace: WorkspaceContext;
};
