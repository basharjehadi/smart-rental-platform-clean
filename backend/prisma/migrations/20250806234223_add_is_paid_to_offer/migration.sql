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
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_offers" ("availableFrom", "createdAt", "depositAmount", "description", "id", "landlordId", "leaseDuration", "leaseEndDate", "leaseStartDate", "matchScore", "paymentIntentId", "preferredPaymentGateway", "propertyAddress", "propertyAmenities", "propertyDescription", "propertyId", "propertyImages", "propertySize", "propertyType", "propertyVideo", "rentAmount", "rentalRequestId", "responseTime", "rulesPdf", "rulesText", "status", "updatedAt", "utilitiesIncluded") SELECT "availableFrom", "createdAt", "depositAmount", "description", "id", "landlordId", "leaseDuration", "leaseEndDate", "leaseStartDate", "matchScore", "paymentIntentId", "preferredPaymentGateway", "propertyAddress", "propertyAmenities", "propertyDescription", "propertyId", "propertyImages", "propertySize", "propertyType", "propertyVideo", "rentAmount", "rentalRequestId", "responseTime", "rulesPdf", "rulesText", "status", "updatedAt", "utilitiesIncluded" FROM "offers";
DROP TABLE "offers";
ALTER TABLE "new_offers" RENAME TO "offers";
CREATE INDEX "offers_landlordId_status_idx" ON "offers"("landlordId", "status");
CREATE INDEX "offers_rentalRequestId_status_idx" ON "offers"("rentalRequestId", "status");
CREATE INDEX "offers_status_createdAt_idx" ON "offers"("status", "createdAt");
CREATE INDEX "offers_propertyId_idx" ON "offers"("propertyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
