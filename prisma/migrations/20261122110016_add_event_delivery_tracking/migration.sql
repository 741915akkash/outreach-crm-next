-- CreateEnum
CREATE TYPE "event_delivery_status" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "event_delivery_attempt_status" AS ENUM ('SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "event_deliveries" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "status" "event_delivery_status" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_delivery_attempts" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "event_delivery_attempt_status" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "errorStack" TEXT,

    CONSTRAINT "event_delivery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_deliveries_status_availableAt_idx" ON "event_deliveries"("status", "availableAt");

-- CreateIndex
CREATE INDEX "event_deliveries_eventId_idx" ON "event_deliveries"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_deliveries_eventId_subscriberId_key" ON "event_deliveries"("eventId", "subscriberId");

-- CreateIndex
CREATE INDEX "event_delivery_attempts_deliveryId_startedAt_idx" ON "event_delivery_attempts"("deliveryId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_delivery_attempts_deliveryId_attemptNumber_key" ON "event_delivery_attempts"("deliveryId", "attemptNumber");

-- AddForeignKey
ALTER TABLE "event_deliveries" ADD CONSTRAINT "event_deliveries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "outbox_events"("eventId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_delivery_attempts" ADD CONSTRAINT "event_delivery_attempts_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "event_deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
