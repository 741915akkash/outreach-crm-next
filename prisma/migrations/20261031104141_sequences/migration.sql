-- CreateEnum
CREATE TYPE "sequence_step_type" AS ENUM ('EMAIL', 'CALL', 'LINKEDIN', 'TASK', 'MEETING');

-- CreateTable
CREATE TABLE "sequences" (
    "id" SERIAL NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sequence_steps" (
    "id" SERIAL NOT NULL,
    "sequenceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "sequence_step_type" NOT NULL,
    "position" INTEGER NOT NULL,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sequence_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sequences_workspaceId_idx" ON "sequences"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "sequences_workspaceId_name_key" ON "sequences"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sequence_steps_sequenceId_name_key" ON "sequence_steps"("sequenceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sequence_steps_sequenceId_position_key" ON "sequence_steps"("sequenceId", "position");

-- AddForeignKey
ALTER TABLE "sequences" ADD CONSTRAINT "sequences_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sequence_steps" ADD CONSTRAINT "sequence_steps_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
