/*
  Warnings:

  - You are about to drop the column `preferredPaymentGateway` on the `rental_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "offers" ADD COLUMN "preferredPaymentGateway" TEXT;

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "rental_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_rental_requests" ("additionalRequirements", "bathrooms", "bedrooms", "budget", "createdAt", "description", "flexibleOnMoveInDate", "furnished", "id", "isLocked", "location", "maxCommuteTime", "moveInDate", "mustHaveFeatures", "parking", "petsAllowed", "preferredNeighborhood", "status", "tenantId", "title", "updatedAt") SELECT "additionalRequirements", "bathrooms", "bedrooms", "budget", "createdAt", "description", "flexibleOnMoveInDate", "furnished", "id", "isLocked", "location", "maxCommuteTime", "moveInDate", "mustHaveFeatures", "parking", "petsAllowed", "preferredNeighborhood", "status", "tenantId", "title", "updatedAt" FROM "rental_requests";
DROP TABLE "rental_requests";
ALTER TABLE "new_rental_requests" RENAME TO "rental_requests";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
