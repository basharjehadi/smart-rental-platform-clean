-- Remove tenant capacity fields from User model
ALTER TABLE users DROP COLUMN "autoAvailability";
ALTER TABLE users DROP COLUMN "maxTenants";
ALTER TABLE users DROP COLUMN "currentTenants";

-- Remove tenant capacity fields from LandlordProfile model
ALTER TABLE landlord_profiles DROP COLUMN "maxTenants";
ALTER TABLE landlord_profiles DROP COLUMN "currentTenants";
ALTER TABLE landlord_profiles DROP COLUMN "autoAvailability";

-- Remove tenant capacity fields from Property model
ALTER TABLE properties DROP COLUMN "maxTenants";
ALTER TABLE properties DROP COLUMN "currentTenants";

-- Add availability field to Property model
ALTER TABLE properties ADD COLUMN "availability" BOOLEAN NOT NULL DEFAULT true;

-- Update indexes
DROP INDEX IF EXISTS "users_role_availability_autoAvailability_currentTenants_idx";
CREATE INDEX "users_role_availability_idx" ON "users"("role", "availability");

DROP INDEX IF EXISTS "landlord_profiles_maxTenants_currentTenants_idx";
DROP INDEX IF EXISTS "landlord_profiles_manualAvailability_autoAvailability_idx";
CREATE INDEX "landlord_profiles_manualAvailability_idx" ON "landlord_profiles"("manualAvailability");

-- Update property indexes to include availability
DROP INDEX IF EXISTS "properties_landlordId_status_idx";
CREATE INDEX "properties_landlordId_status_availability_idx" ON "properties"("landlordId", "status", "availability");

DROP INDEX IF EXISTS "properties_city_status_idx";
CREATE INDEX "properties_city_status_availability_idx" ON "properties"("city", "status", "availability");

DROP INDEX IF EXISTS "properties_propertyType_status_idx";
CREATE INDEX "properties_propertyType_status_availability_idx" ON "properties"("propertyType", "status", "availability");

DROP INDEX IF EXISTS "properties_monthlyRent_status_idx";
CREATE INDEX "properties_monthlyRent_status_availability_idx" ON "properties"("monthlyRent", "status", "availability");
