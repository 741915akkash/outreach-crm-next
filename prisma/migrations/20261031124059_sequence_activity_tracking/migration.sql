-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "activity_type" ADD VALUE 'SEQUENCE_ASSIGNED';
ALTER TYPE "activity_type" ADD VALUE 'SEQUENCE_UNASSIGNED';
ALTER TYPE "activity_type" ADD VALUE 'SEQUENCE_STEP_COMPLETED';

-- AlterTable
ALTER TABLE "lead_activities" ADD COLUMN     "sequenceId" INTEGER,
ADD COLUMN     "sequenceStepId" INTEGER;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "sequences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_sequenceStepId_fkey" FOREIGN KEY ("sequenceStepId") REFERENCES "sequence_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
