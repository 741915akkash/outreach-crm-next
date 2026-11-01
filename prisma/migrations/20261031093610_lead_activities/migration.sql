-- CreateEnum
CREATE TYPE "activity_actor_type" AS ENUM ('USER', 'TOOL', 'AGENT');

-- CreateEnum
CREATE TYPE "activity_type" AS ENUM ('NOTE', 'EMAIL', 'CALL', 'MEETING', 'LINKEDIN');

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" SERIAL NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "leadId" INTEGER NOT NULL,
    "createdByType" "activity_actor_type" NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" "activity_type" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_activities_workspaceId_idx" ON "lead_activities"("workspaceId");

-- CreateIndex
CREATE INDEX "lead_activities_leadId_createdAt_idx" ON "lead_activities"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_activities_createdByType_createdById_idx" ON "lead_activities"("createdByType", "createdById");

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
