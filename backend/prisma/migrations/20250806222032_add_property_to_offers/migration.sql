/*
  Warnings:

  - You are about to drop the column `parking` on the `rental_requests` table. All the data in the column will be lost.
  - You are about to drop the column `petsAllowed` on the `rental_requests` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_offers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rentAmount" REAL NOT NULL,
    "depositAmount" REAL,
    "leaseDuration" INTEGER NOT NULL,
    "description" TEXT,
    "utilitiesIncluded" BOOLEAN NOT NULL DEFAULT false,
    "availableFrom" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentIntentId" TEXT,
    "leaseStartDate" DATETIME,
    "leaseEndDate" DATETIME,
    "propertyAddress" TEXT,
    "propertyImages" TEXT,
    "propertyVideo" TEXT,
    "propertyType" TEXT,
    "propertySize" TEXT,
    "propertyAmenities" TEXT,
    "propertyDescription" TEXT,
    "rulesText" TEXT,
    "rulesPdf" TEXT,
    "preferredPaymentGateway" TEXT,
    "responseTime" INTEGER,
    "matchScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "rentalRequestId" INTEGER NOT NULL,
    "landlordId" TEXT NOT NULL,
    "propertyId" TEXT,
    CONSTRAINT "offers_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "rental_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "offers_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "offers_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_offers" ("availableFrom", "createdAt", "depositAmount", "description", "id", "landlordId", "leaseDuration", "leaseEndDate", "leaseStartDate", "matchScore", "paymentIntentId", "preferredPaymentGateway", "propertyAddress", "propertyAmenities", "propertyDescription", "propertyImages", "propertySize", "propertyType", "propertyVideo", "rentAmount", "rentalRequestId", "responseTime", "rulesPdf", "rulesText", "status", "updatedAt", "utilitiesIncluded") SELECT "availableFrom", "createdAt", "depositAmount", "description", "id", "landlordId", "leaseDuration", "leaseEndDate", "leaseStartDate", "matchScore", "paymentIntentId", "preferredPaymentGateway", "propertyAddress", "propertyAmenities", "propertyDescription", "propertyImages", "propertySize", "propertyType", "propertyVideo", "rentAmount", "rentalRequestId", "responseTime", "rulesPdf", "rulesText", "status", "updatedAt", "utilitiesIncluded" FROM "offers";
DROP TABLE "offers";
ALTER TABLE "new_offers" RENAME TO "offers";
CREATE INDEX "offers_landlordId_status_idx" ON "offers"("landlordId", "status");
CREATE INDEX "offers_rentalRequestId_status_idx" ON "offers"("rentalRequestId", "status");
CREATE INDEX "offers_status_createdAt_idx" ON "offers"("status", "createdAt");
CREATE INDEX "offers_propertyId_idx" ON "offers"("propertyId");
CREATE TABLE "new_rental_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "moveInDate" DATETIME NOT NULL,
    "budget" REAL NOT NULL,
    "budgetFrom" REAL,
    "budgetTo" REAL,
    "propertyType" TEXT,
    "district" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "additionalRequirements" TEXT,
    "preferredNeighborhood" TEXT,
    "maxCommuteTime" TEXT,
    "mustHaveFeatures" TEXT,
    "flexibleOnMoveInDate" BOOLEAN NOT NULL DEFAULT false,
    "poolStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "matchScore" REAL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "rental_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_rental_requests" ("additionalRequirements", "bathrooms", "bedrooms", "budget", "budgetFrom", "budgetTo", "createdAt", "description", "district", "expiresAt", "flexibleOnMoveInDate", "furnished", "id", "isLocked", "location", "matchScore", "maxCommuteTime", "moveInDate", "mustHaveFeatures", "poolStatus", "preferredNeighborhood", "propertyType", "responseCount", "status", "tenantId", "title", "updatedAt", "viewCount") SELECT "additionalRequirements", "bathrooms", "bedrooms", "budget", "budgetFrom", "budgetTo", "createdAt", "description", "district", "expiresAt", "flexibleOnMoveInDate", "furnished", "id", "isLocked", "location", "matchScore", "maxCommuteTime", "moveInDate", "mustHaveFeatures", "poolStatus", "preferredNeighborhood", "propertyType", "responseCount", "status", "tenantId", "title", "updatedAt", "viewCount" FROM "rental_requests";
DROP TABLE "rental_requests";
ALTER TABLE "new_rental_requests" RENAME TO "rental_requests";
CREATE INDEX "rental_requests_location_status_poolStatus_idx" ON "rental_requests"("location", "status", "poolStatus");
CREATE INDEX "rental_requests_budget_status_idx" ON "rental_requests"("budget", "status");
CREATE INDEX "rental_requests_createdAt_poolStatus_idx" ON "rental_requests"("createdAt", "poolStatus");
CREATE INDEX "rental_requests_tenantId_status_idx" ON "rental_requests"("tenantId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
