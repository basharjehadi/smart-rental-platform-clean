/*
  Warnings:

  - You are about to drop the column `createdAt` on the `contract_signatures` table. All the data in the column will be lost.
  - You are about to drop the column `landlordSignatureBase64` on the `contract_signatures` table. All the data in the column will be lost.
  - You are about to drop the column `tenantSignatureBase64` on the `contract_signatures` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `contract_signatures` table. All the data in the column will be lost.
  - You are about to drop the column `agreementDate` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `depositAmount` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `generatedAt` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `landlordSignedAt` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `leaseEndDate` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `leaseStartDate` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `rentAmount` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `tenantSignedAt` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `contractGenerated` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `contractGeneratedAt` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentIntentId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `offerId` on the `rent_payments` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `rent_payments` table. All the data in the column will be lost.
  - Added the required column `signature` to the `contract_signatures` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gateway` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `rent_payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "landlord_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preferredLocations" TEXT,
    "maxBudget" REAL,
    "minBudget" REAL,
    "maxTenants" INTEGER NOT NULL DEFAULT 5,
    "currentTenants" INTEGER NOT NULL DEFAULT 0,
    "manualAvailability" BOOLEAN NOT NULL DEFAULT true,
    "autoAvailability" BOOLEAN NOT NULL DEFAULT true,
    "propertyTypes" TEXT,
    "amenities" TEXT,
    "propertyRules" TEXT,
    "propertyDescription" TEXT,
    "propertyImages" TEXT,
    "propertyVideos" TEXT,
    "autoFillMedia" BOOLEAN NOT NULL DEFAULT true,
    "autoFillRules" BOOLEAN NOT NULL DEFAULT true,
    "autoFillDescription" BOOLEAN NOT NULL DEFAULT true,
    "autoResponse" BOOLEAN NOT NULL DEFAULT false,
    "responseTemplate" TEXT,
    "averageResponseTime" INTEGER,
    "acceptanceRate" REAL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "landlord_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Poland',
    "propertyType" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "size" REAL,
    "floor" INTEGER,
    "totalFloors" INTEGER,
    "monthlyRent" REAL NOT NULL,
    "depositAmount" REAL,
    "utilitiesIncluded" BOOLEAN NOT NULL DEFAULT false,
    "availableFrom" DATETIME,
    "availableUntil" DATETIME,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "parking" BOOLEAN NOT NULL DEFAULT false,
    "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "maxTenants" INTEGER NOT NULL DEFAULT 1,
    "currentTenants" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "houseRules" TEXT,
    "images" TEXT,
    "videos" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "landlordId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "properties_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "request_pool_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "activeRequests" INTEGER NOT NULL DEFAULT 0,
    "matchedRequests" INTEGER NOT NULL DEFAULT 0,
    "expiredRequests" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTime" INTEGER,
    "averageMatchScore" REAL,
    "conversionRate" REAL,
    "location" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "landlordCount" INTEGER NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "landlord_request_matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchScore" REAL NOT NULL,
    "matchReason" TEXT,
    "isViewed" BOOLEAN NOT NULL DEFAULT false,
    "isResponded" BOOLEAN NOT NULL DEFAULT false,
    "landlordId" TEXT NOT NULL,
    "rentalRequestId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "landlord_request_matches_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "landlord_request_matches_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "rental_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_contract_signatures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signature" TEXT NOT NULL,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rentalRequestId" INTEGER NOT NULL,
    CONSTRAINT "contract_signatures_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "rental_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_contract_signatures" ("id", "rentalRequestId", "signedAt") SELECT "id", "rentalRequestId", "signedAt" FROM "contract_signatures";
DROP TABLE "contract_signatures";
ALTER TABLE "new_contract_signatures" RENAME TO "contract_signatures";
CREATE UNIQUE INDEX "contract_signatures_rentalRequestId_key" ON "contract_signatures"("rentalRequestId");
CREATE TABLE "new_contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "pdfUrl" TEXT,
    "signedAt" DATETIME,
    "generationTime" INTEGER,
    "fileSize" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "rentalRequestId" INTEGER NOT NULL,
    CONSTRAINT "contracts_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "rental_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_contracts" ("contractNumber", "createdAt", "id", "pdfUrl", "rentalRequestId", "signedAt", "status", "updatedAt") SELECT "contractNumber", "createdAt", "id", "pdfUrl", "rentalRequestId", "signedAt", "status", "updatedAt" FROM "contracts";
DROP TABLE "contracts";
ALTER TABLE "new_contracts" RENAME TO "contracts";
CREATE UNIQUE INDEX "contracts_contractNumber_key" ON "contracts"("contractNumber");
CREATE UNIQUE INDEX "contracts_rentalRequestId_key" ON "contracts"("rentalRequestId");
CREATE INDEX "contracts_status_signedAt_idx" ON "contracts"("status", "signedAt");
CREATE INDEX "contracts_contractNumber_idx" ON "contracts"("contractNumber");
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
    CONSTRAINT "offers_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "rental_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "offers_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_offers" ("availableFrom", "createdAt", "depositAmount", "description", "id", "landlordId", "leaseDuration", "leaseEndDate", "leaseStartDate", "paymentIntentId", "preferredPaymentGateway", "propertyAddress", "propertyAmenities", "propertyDescription", "propertyImages", "propertySize", "propertyType", "propertyVideo", "rentAmount", "rentalRequestId", "rulesPdf", "rulesText", "status", "updatedAt", "utilitiesIncluded") SELECT "availableFrom", "createdAt", "depositAmount", "description", "id", "landlordId", "leaseDuration", "leaseEndDate", "leaseStartDate", "paymentIntentId", "preferredPaymentGateway", "propertyAddress", "propertyAmenities", "propertyDescription", "propertyImages", "propertySize", "propertyType", "propertyVideo", "rentAmount", "rentalRequestId", "rulesPdf", "rulesText", "status", "updatedAt", "utilitiesIncluded" FROM "offers";
DROP TABLE "offers";
ALTER TABLE "new_offers" RENAME TO "offers";
CREATE UNIQUE INDEX "offers_rentalRequestId_key" ON "offers"("rentalRequestId");
CREATE INDEX "offers_landlordId_status_idx" ON "offers"("landlordId", "status");
CREATE INDEX "offers_rentalRequestId_status_idx" ON "offers"("rentalRequestId", "status");
CREATE INDEX "offers_status_createdAt_idx" ON "offers"("status", "createdAt");
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
    CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "rental_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payments_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "createdAt", "id", "purpose", "rentalRequestId", "status", "updatedAt", "userId") SELECT "amount", "createdAt", "id", "purpose", "rentalRequestId", "status", "updatedAt", "userId" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
CREATE UNIQUE INDEX "payments_paymentIntentId_key" ON "payments"("paymentIntentId");
CREATE INDEX "payments_userId_status_idx" ON "payments"("userId", "status");
CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");
CREATE INDEX "payments_paymentIntentId_idx" ON "payments"("paymentIntentId");
CREATE TABLE "new_rent_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" DATETIME NOT NULL,
    "paidDate" DATETIME,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "lateFee" REAL NOT NULL DEFAULT 0,
    "gracePeriod" INTEGER NOT NULL DEFAULT 5,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT,
    CONSTRAINT "rent_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rent_payments_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_rent_payments" ("amount", "createdAt", "dueDate", "id", "month", "paidDate", "status", "updatedAt", "year") SELECT "amount", "createdAt", "dueDate", "id", "month", "paidDate", "status", "updatedAt", "year" FROM "rent_payments";
DROP TABLE "rent_payments";
ALTER TABLE "new_rent_payments" RENAME TO "rent_payments";
CREATE INDEX "rent_payments_userId_month_year_idx" ON "rent_payments"("userId", "month", "year");
CREATE INDEX "rent_payments_status_dueDate_idx" ON "rent_payments"("status", "dueDate");
CREATE INDEX "rent_payments_isOverdue_dueDate_idx" ON "rent_payments"("isOverdue", "dueDate");
CREATE TABLE "new_rental_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "moveInDate" DATETIME NOT NULL,
    "budget" REAL NOT NULL,
    "budgetFrom" REAL,
    "budgetTo" REAL,
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
INSERT INTO "new_rental_requests" ("additionalRequirements", "bathrooms", "bedrooms", "budget", "createdAt", "description", "flexibleOnMoveInDate", "furnished", "id", "isLocked", "location", "maxCommuteTime", "moveInDate", "mustHaveFeatures", "parking", "petsAllowed", "preferredNeighborhood", "status", "tenantId", "title", "updatedAt") SELECT "additionalRequirements", "bathrooms", "bedrooms", "budget", "createdAt", "description", "flexibleOnMoveInDate", "furnished", "id", "isLocked", "location", "maxCommuteTime", "moveInDate", "mustHaveFeatures", "parking", "petsAllowed", "preferredNeighborhood", "status", "tenantId", "title", "updatedAt" FROM "rental_requests";
DROP TABLE "rental_requests";
ALTER TABLE "new_rental_requests" RENAME TO "rental_requests";
CREATE INDEX "rental_requests_location_status_poolStatus_idx" ON "rental_requests"("location", "status", "poolStatus");
CREATE INDEX "rental_requests_budget_status_idx" ON "rental_requests"("budget", "status");
CREATE INDEX "rental_requests_createdAt_poolStatus_idx" ON "rental_requests"("createdAt", "poolStatus");
CREATE INDEX "rental_requests_tenantId_status_idx" ON "rental_requests"("tenantId", "status");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'TENANT',
    "googleId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "pesel" TEXT,
    "passportNumber" TEXT,
    "kartaPobytuNumber" TEXT,
    "phoneNumber" TEXT,
    "dowodOsobistyNumber" TEXT,
    "address" TEXT,
    "profileImage" TEXT,
    "signatureBase64" TEXT,
    "identityDocument" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "availability" BOOLEAN NOT NULL DEFAULT true,
    "autoAvailability" BOOLEAN NOT NULL DEFAULT true,
    "maxTenants" INTEGER NOT NULL DEFAULT 5,
    "currentTenants" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "responseTime" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("address", "createdAt", "dowodOsobistyNumber", "email", "firstName", "googleId", "id", "identityDocument", "kartaPobytuNumber", "lastName", "name", "passportNumber", "password", "pesel", "phoneNumber", "profileImage", "role", "signatureBase64", "updatedAt") SELECT "address", "createdAt", "dowodOsobistyNumber", "email", "firstName", "googleId", "id", "identityDocument", "kartaPobytuNumber", "lastName", "name", "passportNumber", "password", "pesel", "phoneNumber", "profileImage", "role", "signatureBase64", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE INDEX "users_role_availability_autoAvailability_currentTenants_idx" ON "users"("role", "availability", "autoAvailability", "currentTenants");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_lastActiveAt_idx" ON "users"("lastActiveAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "landlord_profiles_userId_key" ON "landlord_profiles"("userId");

-- CreateIndex
CREATE INDEX "landlord_profiles_preferredLocations_idx" ON "landlord_profiles"("preferredLocations");

-- CreateIndex
CREATE INDEX "landlord_profiles_maxBudget_minBudget_idx" ON "landlord_profiles"("maxBudget", "minBudget");

-- CreateIndex
CREATE INDEX "landlord_profiles_maxTenants_currentTenants_idx" ON "landlord_profiles"("maxTenants", "currentTenants");

-- CreateIndex
CREATE INDEX "landlord_profiles_manualAvailability_autoAvailability_idx" ON "landlord_profiles"("manualAvailability", "autoAvailability");

-- CreateIndex
CREATE INDEX "properties_landlordId_status_idx" ON "properties"("landlordId", "status");

-- CreateIndex
CREATE INDEX "properties_city_status_idx" ON "properties"("city", "status");

-- CreateIndex
CREATE INDEX "properties_propertyType_status_idx" ON "properties"("propertyType", "status");

-- CreateIndex
CREATE INDEX "properties_monthlyRent_status_idx" ON "properties"("monthlyRent", "status");

-- CreateIndex
CREATE INDEX "request_pool_analytics_location_date_idx" ON "request_pool_analytics"("location", "date");

-- CreateIndex
CREATE INDEX "request_pool_analytics_date_idx" ON "request_pool_analytics"("date");

-- CreateIndex
CREATE INDEX "landlord_request_matches_landlordId_matchScore_idx" ON "landlord_request_matches"("landlordId", "matchScore");

-- CreateIndex
CREATE INDEX "landlord_request_matches_rentalRequestId_matchScore_idx" ON "landlord_request_matches"("rentalRequestId", "matchScore");

-- CreateIndex
CREATE INDEX "landlord_request_matches_isViewed_isResponded_idx" ON "landlord_request_matches"("isViewed", "isResponded");

-- CreateIndex
CREATE UNIQUE INDEX "landlord_request_matches_landlordId_rentalRequestId_key" ON "landlord_request_matches"("landlordId", "rentalRequestId");
