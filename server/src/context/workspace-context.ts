import type { WorkspaceRole } from '@/generated/prisma/enums.js';

export type WorkspaceContext = {
  workspaceId: string;
  role: WorkspaceRole;
};
