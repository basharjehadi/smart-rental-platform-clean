-- Add new lease statuses and review fields for early termination handling
-- Migration: 20250829000001_add_lease_status_hooks

-- Add new lease statuses to the enum
-- Note: PostgreSQL doesn't support adding values to existing enums in a simple way
-- This will need to be handled carefully in production

-- Add new fields to reviews table
ALTER TABLE "public"."reviews" ADD COLUMN "isEarlyTermination" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."reviews" ADD COLUMN "earlyTerminationReason" TEXT;
ALTER TABLE "public"."reviews" ADD COLUMN "excludeFromAggregates" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for performance
CREATE INDEX "reviews_isEarlyTermination_idx" ON "public"."reviews"("isEarlyTermination");
CREATE INDEX "reviews_excludeFromAggregates_idx" ON "public"."reviews"("excludeFromAggregates");

-- Add comment explaining the new fields
COMMENT ON COLUMN "public"."reviews"."isEarlyTermination" IS 'Indicates if this review was created due to early lease termination';
COMMENT ON COLUMN "public"."reviews"."earlyTerminationReason" IS 'Reason for early termination (e.g., TERMINATED_24H, early move-out)';
COMMENT ON COLUMN "public"."reviews"."excludeFromAggregates" IS 'Excludes this review from user rating calculations and aggregates';
