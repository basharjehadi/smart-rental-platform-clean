/*
  Warnings:

  - You are about to drop the column `parking` on the `rental_requests` table. All the data in the column will be lost.
  - You are about to drop the column `petsAllowed` on the `rental_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "properties" ADD COLUMN "district" TEXT;

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitNumber" TEXT NOT NULL,
    "floor" INTEGER,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "area" REAL NOT NULL,
    "rentAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "propertyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "rentAmount" REAL NOT NULL,
    "depositAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "leases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "leases_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reviews_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "leaseId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "maintenance_requests_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentIntentId" TEXT,
    "purpose" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "processingTime" INTEGER,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "userId" TEXT NOT NULL,
    "rentalRequestId" INTEGER,
    "offerId" TEXT,
    "leaseId" TEXT,
    CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "rental_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payments_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payments_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "createdAt", "currency", "errorMessage", "gateway", "id", "offerId", "paidAt", "paymentIntentId", "processingTime", "purpose", "rentalRequestId", "retryCount", "status", "updatedAt", "userId") SELECT "amount", "createdAt", "currency", "errorMessage", "gateway", "id", "offerId", "paidAt", "paymentIntentId", "processingTime", "purpose", "rentalRequestId", "retryCount", "status", "updatedAt", "userId" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
CREATE UNIQUE INDEX "payments_paymentIntentId_key" ON "payments"("paymentIntentId");
CREATE INDEX "payments_userId_status_idx" ON "payments"("userId", "status");
CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");
CREATE INDEX "payments_paymentIntentId_idx" ON "payments"("paymentIntentId");
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
INSERT INTO "new_rental_requests" ("additionalRequirements", "bathrooms", "bedrooms", "budget", "budgetFrom", "budgetTo", "createdAt", "description", "expiresAt", "flexibleOnMoveInDate", "furnished", "id", "isLocked", "location", "matchScore", "maxCommuteTime", "moveInDate", "mustHaveFeatures", "poolStatus", "preferredNeighborhood", "propertyType", "responseCount", "status", "tenantId", "title", "updatedAt", "viewCount") SELECT "additionalRequirements", "bathrooms", "bedrooms", "budget", "budgetFrom", "budgetTo", "createdAt", "description", "expiresAt", "flexibleOnMoveInDate", "furnished", "id", "isLocked", "location", "matchScore", "maxCommuteTime", "moveInDate", "mustHaveFeatures", "poolStatus", "preferredNeighborhood", "propertyType", "responseCount", "status", "tenantId", "title", "updatedAt", "viewCount" FROM "rental_requests";
DROP TABLE "rental_requests";
ALTER TABLE "new_rental_requests" RENAME TO "rental_requests";
CREATE INDEX "rental_requests_location_status_poolStatus_idx" ON "rental_requests"("location", "status", "poolStatus");
CREATE INDEX "rental_requests_budget_status_idx" ON "rental_requests"("budget", "status");
CREATE INDEX "rental_requests_createdAt_poolStatus_idx" ON "rental_requests"("createdAt", "poolStatus");
CREATE INDEX "rental_requests_tenantId_status_idx" ON "rental_requests"("tenantId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "units_propertyId_status_idx" ON "units"("propertyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "leases_unitId_key" ON "leases"("unitId");

-- CreateIndex
CREATE INDEX "leases_tenantId_idx" ON "leases"("tenantId");

-- CreateIndex
CREATE INDEX "leases_status_idx" ON "leases"("status");

-- CreateIndex
CREATE INDEX "leases_endDate_idx" ON "leases"("endDate");

-- CreateIndex
CREATE INDEX "reviews_leaseId_idx" ON "reviews"("leaseId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "maintenance_requests_leaseId_status_idx" ON "maintenance_requests"("leaseId", "status");

-- CreateIndex
CREATE INDEX "maintenance_requests_priority_idx" ON "maintenance_requests"("priority");
