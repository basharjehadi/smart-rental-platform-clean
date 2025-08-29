-- AlterTable
ALTER TABLE "public"."audit_logs" ADD COLUMN     "userDisplayName" TEXT;

-- AlterTable
ALTER TABLE "public"."messages" ADD COLUMN     "recipientDisplayName" TEXT,
ADD COLUMN     "senderDisplayName" TEXT;

-- AlterTable
ALTER TABLE "public"."review_replies" ADD COLUMN     "userDisplayName" TEXT;

-- AlterTable
ALTER TABLE "public"."review_reports" ADD COLUMN     "reporterDisplayName" TEXT;

-- AlterTable
ALTER TABLE "public"."review_signals" ADD COLUMN     "userDisplayName" TEXT;

-- AlterTable
ALTER TABLE "public"."reviews" ADD COLUMN     "revieweeDisplayName" TEXT,
ADD COLUMN     "reviewerDisplayName" TEXT;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "anonymizedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
