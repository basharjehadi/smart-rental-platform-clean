/*
  Warnings:

  - You are about to drop the column `isPendingTenantInput` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `reviews` table. All the data in the column will be lost.
  - Added the required column `reviewerId` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetUserId` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- First, add the new columns as nullable
ALTER TABLE "public"."reviews" ADD COLUMN "reviewerId" TEXT;
ALTER TABLE "public"."reviews" ADD COLUMN "targetUserId" TEXT;

-- Update existing data: set reviewerId and targetUserId to the old tenantId value
UPDATE "public"."reviews" SET "reviewerId" = "tenantId", "targetUserId" = "tenantId";

-- Now make the columns NOT NULL
ALTER TABLE "public"."reviews" ALTER COLUMN "reviewerId" SET NOT NULL;
ALTER TABLE "public"."reviews" ALTER COLUMN "targetUserId" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "public"."reviews" DROP CONSTRAINT "reviews_tenantId_fkey";

-- DropIndex
DROP INDEX "public"."reviews_tenantId_idx";

-- AlterTable
ALTER TABLE "public"."reviews" DROP COLUMN "isPendingTenantInput",
DROP COLUMN "tenantId";

-- CreateIndex
CREATE INDEX "reviews_reviewerId_idx" ON "public"."reviews"("reviewerId");

-- CreateIndex
CREATE INDEX "reviews_targetUserId_idx" ON "public"."reviews"("targetUserId");

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
