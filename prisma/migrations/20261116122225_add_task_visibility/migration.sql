-- CreateEnum
CREATE TYPE "task_visibility" AS ENUM ('EVERYONE', 'PRIVATE');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "visibility" "task_visibility" NOT NULL DEFAULT 'EVERYONE';
