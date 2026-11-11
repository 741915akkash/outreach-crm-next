import type { Actor } from './actor';
import type { WorkspaceContext } from './workspace-context';

export type ExecutionContext = {
  actor: Actor;
  workspace: WorkspaceContext;
  requestId: string;
  initiatedByUserId?: string;
};
