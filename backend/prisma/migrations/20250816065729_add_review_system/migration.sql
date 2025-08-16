/*
  Warnings:

  - A unique constraint covering the columns `[landlordId,rentalRequestId,propertyId]` on the table `landlord_request_matches` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ReviewStage" AS ENUM ('INITIAL', 'PAYMENT_COMPLETED', 'MOVE_IN', 'LEASE_END');

-- DropIndex
DROP INDEX "public"."landlord_request_matches_landlordId_rentalRequestId_key";

-- AlterTable
ALTER TABLE "public"."landlord_request_matches" ADD COLUMN     "propertyId" TEXT;

-- AlterTable
ALTER TABLE "public"."reviews" ADD COLUMN     "isPendingTenantInput" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSystemGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewStage" "public"."ReviewStage" NOT NULL DEFAULT 'INITIAL',
ALTER COLUMN "leaseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "averageRating" DOUBLE PRECISION DEFAULT 5.0,
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "landlord_request_matches_propertyId_idx" ON "public"."landlord_request_matches"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "landlord_request_matches_landlordId_rentalRequestId_propert_key" ON "public"."landlord_request_matches"("landlordId", "rentalRequestId", "propertyId");

-- CreateIndex
CREATE INDEX "reviews_reviewStage_idx" ON "public"."reviews"("reviewStage");

-- CreateIndex
CREATE INDEX "reviews_tenantId_idx" ON "public"."reviews"("tenantId");

-- AddForeignKey
ALTER TABLE "public"."landlord_request_matches" ADD CONSTRAINT "landlord_request_matches_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
