-- CreateEnum
CREATE TYPE "public"."MoveInVerificationStatus" AS ENUM ('PENDING', 'SUCCESS', 'ISSUE_REPORTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."offers" ADD COLUMN     "cancellationEvidence" TEXT[],
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "moveInVerificationDate" TIMESTAMP(3),
ADD COLUMN     "moveInVerificationDeadline" TIMESTAMP(3),
ADD COLUMN     "moveInVerificationStatus" "public"."MoveInVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verificationNotes" TEXT;
