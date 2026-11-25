-- CreateEnum
CREATE TYPE "DeliveryExecutionType" AS ENUM ('NORMAL_RETRY', 'STALLED_RECOVERY');

-- AlterTable
ALTER TABLE "event_delivery_attempts" ADD COLUMN     "bullmqJobId" TEXT,
ADD COLUMN     "executionType" "DeliveryExecutionType";

-- CreateIndex
CREATE INDEX "event_delivery_attempts_bullmqJobId_idx" ON "event_delivery_attempts"("bullmqJobId");
