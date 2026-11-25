/*
  Warnings:

  - A unique constraint covering the columns `[eventId]` on the table `outbox_events` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventId` to the `outbox_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operationId` to the `outbox_events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "outbox_events" ADD COLUMN     "eventId" TEXT NOT NULL,
ADD COLUMN     "operationId" TEXT NOT NULL,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "triggeredBy" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_eventId_key" ON "outbox_events"("eventId");

-- CreateIndex
CREATE INDEX "outbox_events_workspaceId_operationId_idx" ON "outbox_events"("workspaceId", "operationId");
