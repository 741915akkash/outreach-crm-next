/*
  Warnings:

  - The values [TOOL] on the enum `activity_actor_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `lead_activities` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[workspaceId,id]` on the table `tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "outbox_event_status" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED');

-- DropForeignKey
ALTER TABLE "lead_activities" DROP CONSTRAINT "lead_activities_sequenceId_sequenceStepId_fkey";

-- DropForeignKey
ALTER TABLE "lead_activities" DROP CONSTRAINT "lead_activities_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "lead_activities" DROP CONSTRAINT "lead_activities_workspaceId_leadId_fkey";

-- DropForeignKey
ALTER TABLE "lead_activities" DROP CONSTRAINT "lead_activities_workspaceId_sequenceId_fkey";

-- DropTable
DROP TABLE "lead_activities";

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdByType" "activity_actor_type" NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" "activity_type" NOT NULL,
    "content" TEXT NOT NULL,
    "sequenceId" INTEGER,
    "sequenceStepId" INTEGER,
    "sourceEventId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_leads" (
    "workspaceId" TEXT NOT NULL,
    "activityId" INTEGER NOT NULL,
    "leadId" INTEGER NOT NULL,

    CONSTRAINT "activity_leads_pkey" PRIMARY KEY ("workspaceId","activityId","leadId")
);

-- CreateTable
CREATE TABLE "activity_companies" (
    "workspaceId" TEXT NOT NULL,
    "activityId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "activity_companies_pkey" PRIMARY KEY ("workspaceId","activityId","companyId")
);

-- CreateTable
CREATE TABLE "activity_deals" (
    "workspaceId" TEXT NOT NULL,
    "activityId" INTEGER NOT NULL,
    "dealId" INTEGER NOT NULL,

    CONSTRAINT "activity_deals_pkey" PRIMARY KEY ("workspaceId","activityId","dealId")
);

-- CreateTable
CREATE TABLE "activity_tasks" (
    "workspaceId" TEXT NOT NULL,
    "activityId" INTEGER NOT NULL,
    "taskId" INTEGER NOT NULL,

    CONSTRAINT "activity_tasks_pkey" PRIMARY KEY ("workspaceId","activityId","taskId")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "entityChangedType" TEXT NOT NULL,
    "entityChangedId" TEXT NOT NULL,
    "actorType" "activity_actor_type" NOT NULL,
    "actorId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "outbox_event_status" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activities_sourceEventId_key" ON "activities"("sourceEventId");

-- CreateIndex
CREATE INDEX "activities_workspaceId_createdAt_idx" ON "activities"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "activities_workspaceId_sequenceId_idx" ON "activities"("workspaceId", "sequenceId");

-- CreateIndex
CREATE INDEX "activities_sequenceId_sequenceStepId_idx" ON "activities"("sequenceId", "sequenceStepId");

-- CreateIndex
CREATE INDEX "activities_createdByType_createdById_idx" ON "activities"("createdByType", "createdById");

-- CreateIndex
CREATE UNIQUE INDEX "activities_workspaceId_id_key" ON "activities"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "activity_leads_workspaceId_leadId_idx" ON "activity_leads"("workspaceId", "leadId");

-- CreateIndex
CREATE INDEX "activity_companies_workspaceId_companyId_idx" ON "activity_companies"("workspaceId", "companyId");

-- CreateIndex
CREATE INDEX "activity_deals_workspaceId_dealId_idx" ON "activity_deals"("workspaceId", "dealId");

-- CreateIndex
CREATE INDEX "activity_tasks_workspaceId_taskId_idx" ON "activity_tasks"("workspaceId", "taskId");

-- CreateIndex
CREATE INDEX "outbox_events_status_availableAt_idx" ON "outbox_events"("status", "availableAt");

-- CreateIndex
CREATE INDEX "outbox_events_workspaceId_createdAt_idx" ON "outbox_events"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "outbox_events_workspaceId_entityChangedType_entityChangedId_idx" ON "outbox_events"("workspaceId", "entityChangedType", "entityChangedId");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_workspaceId_id_key" ON "tasks"("workspaceId", "id");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_workspaceId_sequenceId_fkey" FOREIGN KEY ("workspaceId", "sequenceId") REFERENCES "sequences"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_sequenceId_sequenceStepId_fkey" FOREIGN KEY ("sequenceId", "sequenceStepId") REFERENCES "sequence_steps"("sequenceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_leads" ADD CONSTRAINT "activity_leads_workspaceId_activityId_fkey" FOREIGN KEY ("workspaceId", "activityId") REFERENCES "activities"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_leads" ADD CONSTRAINT "activity_leads_workspaceId_leadId_fkey" FOREIGN KEY ("workspaceId", "leadId") REFERENCES "leads"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_companies" ADD CONSTRAINT "activity_companies_workspaceId_activityId_fkey" FOREIGN KEY ("workspaceId", "activityId") REFERENCES "activities"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_companies" ADD CONSTRAINT "activity_companies_workspaceId_companyId_fkey" FOREIGN KEY ("workspaceId", "companyId") REFERENCES "companies"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_deals" ADD CONSTRAINT "activity_deals_workspaceId_activityId_fkey" FOREIGN KEY ("workspaceId", "activityId") REFERENCES "activities"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_deals" ADD CONSTRAINT "activity_deals_workspaceId_dealId_fkey" FOREIGN KEY ("workspaceId", "dealId") REFERENCES "deals"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_tasks" ADD CONSTRAINT "activity_tasks_workspaceId_activityId_fkey" FOREIGN KEY ("workspaceId", "activityId") REFERENCES "activities"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_tasks" ADD CONSTRAINT "activity_tasks_workspaceId_taskId_fkey" FOREIGN KEY ("workspaceId", "taskId") REFERENCES "tasks"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterEnum
BEGIN;
CREATE TYPE "activity_actor_type_new" AS ENUM ('USER', 'AGENT', 'INTEGRATION', 'SYSTEM');
ALTER TABLE "activities" ALTER COLUMN "createdByType" TYPE "activity_actor_type_new" USING ("createdByType"::text::"activity_actor_type_new");
ALTER TABLE "outbox_events" ALTER COLUMN "actorType" TYPE "activity_actor_type_new" USING ("actorType"::text::"activity_actor_type_new");
ALTER TYPE "activity_actor_type" RENAME TO "activity_actor_type_old";
ALTER TYPE "activity_actor_type_new" RENAME TO "activity_actor_type";
DROP TYPE "public"."activity_actor_type_old";
COMMIT;
