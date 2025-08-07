-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "parking" BOOLEAN NOT NULL DEFAULT false,
    "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
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
