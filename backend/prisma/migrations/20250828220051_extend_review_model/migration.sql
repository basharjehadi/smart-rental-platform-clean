/*
  Warnings:

  - The values [LEASE_END] on the enum `ReviewStage` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `date` on the `request_pool_analytics` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[leaseId,reviewerId,targetTenantGroupId,reviewStage]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - Made the column `dateBucket` on table `request_pool_analytics` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('PENDING', 'SUBMITTED', 'PUBLISHED', 'BLOCKED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ReviewStage_new" AS ENUM ('INITIAL', 'PAYMENT_COMPLETED', 'MOVE_IN', 'END_OF_LEASE');
ALTER TABLE "public"."reviews" ALTER COLUMN "reviewStage" DROP DEFAULT;
ALTER TABLE "public"."reviews" ALTER COLUMN "reviewStage" TYPE "public"."ReviewStage_new" USING ("reviewStage"::text::"public"."ReviewStage_new");
ALTER TYPE "public"."ReviewStage" RENAME TO "ReviewStage_old";
ALTER TYPE "public"."ReviewStage_new" RENAME TO "ReviewStage";
DROP TYPE "public"."ReviewStage_old";
ALTER TABLE "public"."reviews" ALTER COLUMN "reviewStage" SET DEFAULT 'INITIAL';
COMMIT;

-- DropIndex
DROP INDEX "public"."properties_status_availableFrom_idx";

-- DropIndex
DROP INDEX "public"."properties_status_monthlyRent_idx";

-- DropIndex
DROP INDEX "public"."request_pool_analytics_date_idx";

-- DropIndex
DROP INDEX "public"."request_pool_analytics_location_date_idx";

-- AlterTable
ALTER TABLE "public"."request_pool_analytics" DROP COLUMN "date",
ALTER COLUMN "dateBucket" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."reviews" ADD COLUMN     "isDoubleBlind" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "publishAfter" TIMESTAMP(3),
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "redactedText" TEXT,
ADD COLUMN     "status" "public"."ReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "violatesPolicy" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "properties_status_availability_monthlyRent_idx" ON "public"."properties"("status", "availability", "monthlyRent");

-- CreateIndex
CREATE INDEX "properties_status_availability_availableFrom_idx" ON "public"."properties"("status", "availability", "availableFrom");

-- CreateIndex
CREATE INDEX "rental_requests_poolStatus_expiresAt_location_idx" ON "public"."rental_requests"("poolStatus", "expiresAt", "location");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_leaseId_reviewerId_targetTenantGroupId_reviewStage_key" ON "public"."reviews"("leaseId", "reviewerId", "targetTenantGroupId", "reviewStage");
