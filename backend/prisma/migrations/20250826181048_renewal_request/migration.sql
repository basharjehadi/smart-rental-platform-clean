-- CreateEnum
CREATE TYPE "public"."RenewalRequestStatus" AS ENUM ('PENDING', 'COUNTERED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."renewal_requests" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "initiatorUserId" TEXT NOT NULL,
    "status" "public"."RenewalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "proposedTermMonths" INTEGER,
    "proposedStartDate" TIMESTAMP(3),
    "proposedMonthlyRent" DOUBLE PRECISION,
    "note" TEXT,
    "counterOfId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "renewal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "renewal_requests_leaseId_status_idx" ON "public"."renewal_requests"("leaseId", "status");

-- CreateIndex
CREATE INDEX "renewal_requests_expiresAt_idx" ON "public"."renewal_requests"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."renewal_requests" ADD CONSTRAINT "renewal_requests_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "public"."leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
