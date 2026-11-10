/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,id]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspaceId,id]` on the table `deals` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspaceId,id]` on the table `leads` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspaceId,id]` on the table `pipelines` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sequenceId,id]` on the table `sequence_steps` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspaceId,id]` on the table `sequences` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspaceId,id]` on the table `sources` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workspaceId` to the `deal_leads` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "deal_leads" DROP CONSTRAINT "deal_leads_dealId_fkey";

-- DropForeignKey
ALTER TABLE "deal_leads" DROP CONSTRAINT "deal_leads_leadId_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_companyId_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_pipelineId_fkey";

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_invitedById_fkey";

-- DropForeignKey
ALTER TABLE "lead_activities" DROP CONSTRAINT "lead_activities_leadId_fkey";

-- DropForeignKey
ALTER TABLE "lead_activities" DROP CONSTRAINT "lead_activities_sequenceId_fkey";

-- DropForeignKey
ALTER TABLE "lead_activities" DROP CONSTRAINT "lead_activities_sequenceStepId_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_companyId_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_pipelineId_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_pipelineId_stageId_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_createdById_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_dealId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_leadId_fkey";

-- DropIndex
DROP INDEX "companies_workspaceId_idx";

-- DropIndex
DROP INDEX "deal_leads_leadId_idx";

-- DropIndex
DROP INDEX "deals_companyId_idx";

-- DropIndex
DROP INDEX "deals_workspaceId_idx";

-- DropIndex
DROP INDEX "invitations_invitedById_idx";

-- DropIndex
DROP INDEX "lead_activities_leadId_createdAt_idx";

-- DropIndex
DROP INDEX "lead_activities_workspaceId_idx";

-- DropIndex
DROP INDEX "leads_companyId_idx";

-- DropIndex
DROP INDEX "leads_phone_idx";

-- DropIndex
DROP INDEX "leads_sourceId_idx";

-- DropIndex
DROP INDEX "leads_workspaceId_idx";

-- DropIndex
DROP INDEX "pipelines_workspaceId_idx";

-- DropIndex
DROP INDEX "sequences_workspaceId_idx";

-- DropIndex
DROP INDEX "sources_workspaceId_idx";

-- DropIndex
DROP INDEX "tasks_assignedToId_status_idx";

-- DropIndex
DROP INDEX "tasks_dealId_idx";

-- DropIndex
DROP INDEX "tasks_leadId_idx";

-- AlterTable
ALTER TABLE "deal_leads" ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "companies_workspaceId_id_key" ON "companies"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "deal_leads_workspaceId_dealId_idx" ON "deal_leads"("workspaceId", "dealId");

-- CreateIndex
CREATE INDEX "deal_leads_workspaceId_leadId_idx" ON "deal_leads"("workspaceId", "leadId");

-- CreateIndex
CREATE INDEX "deals_workspaceId_companyId_idx" ON "deals"("workspaceId", "companyId");

-- CreateIndex
CREATE INDEX "deals_workspaceId_pipelineId_idx" ON "deals"("workspaceId", "pipelineId");

-- CreateIndex
CREATE UNIQUE INDEX "deals_workspaceId_id_key" ON "deals"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "invitations_workspaceId_invitedById_idx" ON "invitations"("workspaceId", "invitedById");

-- CreateIndex
CREATE INDEX "lead_activities_workspaceId_leadId_createdAt_idx" ON "lead_activities"("workspaceId", "leadId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_activities_workspaceId_sequenceId_idx" ON "lead_activities"("workspaceId", "sequenceId");

-- CreateIndex
CREATE INDEX "lead_activities_sequenceId_sequenceStepId_idx" ON "lead_activities"("sequenceId", "sequenceStepId");

-- CreateIndex
CREATE INDEX "leads_workspaceId_pipelineId_idx" ON "leads"("workspaceId", "pipelineId");

-- CreateIndex
CREATE INDEX "leads_pipelineId_stageId_idx" ON "leads"("pipelineId", "stageId");

-- CreateIndex
CREATE INDEX "leads_workspaceId_sourceId_idx" ON "leads"("workspaceId", "sourceId");

-- CreateIndex
CREATE INDEX "leads_workspaceId_companyId_idx" ON "leads"("workspaceId", "companyId");

-- CreateIndex
CREATE INDEX "leads_workspaceId_phone_idx" ON "leads"("workspaceId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "leads_workspaceId_id_key" ON "leads"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "pipelines_workspaceId_id_key" ON "pipelines"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "sequence_steps_sequenceId_id_key" ON "sequence_steps"("sequenceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "sequences_workspaceId_id_key" ON "sequences"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "sources_workspaceId_id_key" ON "sources"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "tasks_workspaceId_assignedToId_status_idx" ON "tasks"("workspaceId", "assignedToId", "status");

-- CreateIndex
CREATE INDEX "tasks_workspaceId_createdById_idx" ON "tasks"("workspaceId", "createdById");

-- CreateIndex
CREATE INDEX "tasks_workspaceId_leadId_idx" ON "tasks"("workspaceId", "leadId");

-- CreateIndex
CREATE INDEX "tasks_workspaceId_dealId_idx" ON "tasks"("workspaceId", "dealId");

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspaceId_invitedById_fkey" FOREIGN KEY ("workspaceId", "invitedById") REFERENCES "workspace_memberships"("workspaceId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_workspaceId_pipelineId_fkey" FOREIGN KEY ("workspaceId", "pipelineId") REFERENCES "pipelines"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_pipelineId_stageId_fkey" FOREIGN KEY ("pipelineId", "stageId") REFERENCES "pipeline_stages"("pipelineId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_workspaceId_sourceId_fkey" FOREIGN KEY ("workspaceId", "sourceId") REFERENCES "sources"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_workspaceId_companyId_fkey" FOREIGN KEY ("workspaceId", "companyId") REFERENCES "companies"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_workspaceId_leadId_fkey" FOREIGN KEY ("workspaceId", "leadId") REFERENCES "leads"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_workspaceId_sequenceId_fkey" FOREIGN KEY ("workspaceId", "sequenceId") REFERENCES "sequences"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_sequenceId_sequenceStepId_fkey" FOREIGN KEY ("sequenceId", "sequenceStepId") REFERENCES "sequence_steps"("sequenceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_workspaceId_companyId_fkey" FOREIGN KEY ("workspaceId", "companyId") REFERENCES "companies"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_workspaceId_pipelineId_fkey" FOREIGN KEY ("workspaceId", "pipelineId") REFERENCES "pipelines"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_leads" ADD CONSTRAINT "deal_leads_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_leads" ADD CONSTRAINT "deal_leads_workspaceId_dealId_fkey" FOREIGN KEY ("workspaceId", "dealId") REFERENCES "deals"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_leads" ADD CONSTRAINT "deal_leads_workspaceId_leadId_fkey" FOREIGN KEY ("workspaceId", "leadId") REFERENCES "leads"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspaceId_assignedToId_fkey" FOREIGN KEY ("workspaceId", "assignedToId") REFERENCES "workspace_memberships"("workspaceId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspaceId_createdById_fkey" FOREIGN KEY ("workspaceId", "createdById") REFERENCES "workspace_memberships"("workspaceId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspaceId_leadId_fkey" FOREIGN KEY ("workspaceId", "leadId") REFERENCES "leads"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspaceId_dealId_fkey" FOREIGN KEY ("workspaceId", "dealId") REFERENCES "deals"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prevent a sequence step from being set without a sequence
ALTER TABLE "lead_activities"
ADD CONSTRAINT "lead_activities_sequence_step_requires_sequence_check"
CHECK (
  "sequenceStepId" IS NULL
  OR "sequenceId" IS NOT NULL
);