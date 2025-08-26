-- CreateEnum
CREATE TYPE "public"."LeaseRenewalStatus" AS ENUM ('NONE', 'DECLINED');

-- AlterTable
ALTER TABLE "public"."leases" ADD COLUMN     "offerId" TEXT,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "renewalDeclinedAt" TIMESTAMP(3),
ADD COLUMN     "renewalDeclinedByUserId" TEXT,
ADD COLUMN     "renewalStatus" "public"."LeaseRenewalStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "rentalRequestId" INTEGER,
ADD COLUMN     "terminationEffectiveDate" TIMESTAMP(3),
ADD COLUMN     "terminationNoticeByUserId" TEXT,
ADD COLUMN     "terminationNoticeDate" TIMESTAMP(3),
ADD COLUMN     "terminationReason" TEXT;

-- AlterTable
ALTER TABLE "public"."properties" ADD COLUMN     "isMarketing" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "leases_offerId_idx" ON "public"."leases"("offerId");

-- CreateIndex
CREATE INDEX "leases_rentalRequestId_idx" ON "public"."leases"("rentalRequestId");

-- CreateIndex
CREATE INDEX "leases_propertyId_idx" ON "public"."leases"("propertyId");

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "public"."rental_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
