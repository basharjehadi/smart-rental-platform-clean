/*
  Warnings:

  - The values [PAYMENT_COMPLETED] on the enum `ReviewStage` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ReviewSignalType" AS ENUM ('PAYMENT_CONFIRMED', 'DEPOSIT_RETURNED');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ReviewStage_new" AS ENUM ('INITIAL', 'MOVE_IN', 'END_OF_LEASE');
ALTER TABLE "public"."reviews" ALTER COLUMN "reviewStage" DROP DEFAULT;
ALTER TABLE "public"."reviews" ALTER COLUMN "reviewStage" TYPE "public"."ReviewStage_new" USING ("reviewStage"::text::"public"."ReviewStage_new");
ALTER TYPE "public"."ReviewStage" RENAME TO "ReviewStage_old";
ALTER TYPE "public"."ReviewStage_new" RENAME TO "ReviewStage";
DROP TYPE "public"."ReviewStage_old";
ALTER TABLE "public"."reviews" ALTER COLUMN "reviewStage" SET DEFAULT 'INITIAL';
COMMIT;

-- CreateTable
CREATE TABLE "public"."review_replies" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."review_reports" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."review_signals" (
    "id" TEXT NOT NULL,
    "signalType" "public"."ReviewSignalType" NOT NULL DEFAULT 'PAYMENT_CONFIRMED',
    "leaseId" TEXT NOT NULL,
    "tenantGroupId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_signals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "review_replies_reviewId_key" ON "public"."review_replies"("reviewId");

-- CreateIndex
CREATE INDEX "review_replies_reviewId_idx" ON "public"."review_replies"("reviewId");

-- CreateIndex
CREATE INDEX "review_replies_revieweeId_idx" ON "public"."review_replies"("revieweeId");

-- CreateIndex
CREATE INDEX "review_reports_reviewId_idx" ON "public"."review_reports"("reviewId");

-- CreateIndex
CREATE INDEX "review_reports_reporterId_idx" ON "public"."review_reports"("reporterId");

-- CreateIndex
CREATE INDEX "review_reports_status_idx" ON "public"."review_reports"("status");

-- CreateIndex
CREATE INDEX "review_reports_createdAt_idx" ON "public"."review_reports"("createdAt");

-- CreateIndex
CREATE INDEX "review_signals_leaseId_idx" ON "public"."review_signals"("leaseId");

-- CreateIndex
CREATE INDEX "review_signals_tenantGroupId_idx" ON "public"."review_signals"("tenantGroupId");

-- CreateIndex
CREATE INDEX "review_signals_signalType_idx" ON "public"."review_signals"("signalType");

-- CreateIndex
CREATE INDEX "review_signals_createdAt_idx" ON "public"."review_signals"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."review_replies" ADD CONSTRAINT "review_replies_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_replies" ADD CONSTRAINT "review_replies_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_reports" ADD CONSTRAINT "review_reports_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_reports" ADD CONSTRAINT "review_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_signals" ADD CONSTRAINT "review_signals_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "public"."leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."review_signals" ADD CONSTRAINT "review_signals_tenantGroupId_fkey" FOREIGN KEY ("tenantGroupId") REFERENCES "public"."tenant_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
