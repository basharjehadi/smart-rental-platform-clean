-- Add revieweeId field to reviews table and update unique constraint
-- Migration: 20250829000000_add_reviewee_id_to_reviews

-- Add revieweeId column
ALTER TABLE "public"."reviews" ADD COLUMN "revieweeId" TEXT;

-- Create index on revieweeId for performance
CREATE INDEX "reviews_revieweeId_idx" ON "public"."reviews"("revieweeId");

-- Add foreign key constraint
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_revieweeId_fkey" 
FOREIGN KEY ("revieweeId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop the old unique constraint
ALTER TABLE "public"."reviews" DROP CONSTRAINT "reviews_leaseId_reviewerId_targetTenantGroupId_reviewStage_key";

-- Add the new unique constraint with revieweeId
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_leaseId_reviewerId_revieweeId_reviewStage_key" 
UNIQUE ("leaseId", "reviewerId", "revieweeId", "reviewStage");

-- Update existing reviews to set revieweeId based on targetTenantGroupId
-- This assumes that targetTenantGroupId maps to a user ID for existing reviews
UPDATE "public"."reviews" 
SET "revieweeId" = "targetTenantGroupId" 
WHERE "revieweeId" IS NULL AND "targetTenantGroupId" IS NOT NULL;

-- Make revieweeId NOT NULL after populating existing data
ALTER TABLE "public"."reviews" ALTER COLUMN "revieweeId" SET NOT NULL;
