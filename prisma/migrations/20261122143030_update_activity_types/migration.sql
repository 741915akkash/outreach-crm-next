-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "activity_type" ADD VALUE 'CREATED';
ALTER TYPE "activity_type" ADD VALUE 'UPDATED';
ALTER TYPE "activity_type" ADD VALUE 'DELETED';
ALTER TYPE "activity_type" ADD VALUE 'STAGE_CHANGED';
ALTER TYPE "activity_type" ADD VALUE 'COMPLETED';
