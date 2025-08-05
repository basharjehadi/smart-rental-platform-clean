-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "citizenship" TEXT,
    "dateOfBirth" DATETIME,
    "street" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "profession" TEXT,
    "dowodOsobistyNumber" TEXT,
    "address" TEXT,
    "profileImage" TEXT,
    "signatureBase64" TEXT,
    "identityDocument" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "kycStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "kycSubmittedAt" DATETIME,
    "kycReviewedAt" DATETIME,
    "kycRejectionReason" TEXT,
    "kycReviewedBy" TEXT,
    "gdprConsent" BOOLEAN NOT NULL DEFAULT false,
    "gdprConsentDate" DATETIME,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspensionReason" TEXT,
    "suspendedAt" DATETIME,
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
INSERT INTO "new_users" ("address", "autoAvailability", "availability", "citizenship", "city", "country", "createdAt", "currentTenants", "dateOfBirth", "dowodOsobistyNumber", "email", "firstName", "gdprConsent", "gdprConsentDate", "googleId", "id", "identityDocument", "isSuspended", "isVerified", "kartaPobytuNumber", "lastActiveAt", "lastName", "maxTenants", "name", "passportNumber", "password", "pesel", "phoneNumber", "profession", "profileImage", "requestCount", "responseTime", "role", "signatureBase64", "street", "suspendedAt", "suspensionReason", "updatedAt", "zipCode") SELECT "address", "autoAvailability", "availability", "citizenship", "city", "country", "createdAt", "currentTenants", "dateOfBirth", "dowodOsobistyNumber", "email", "firstName", "gdprConsent", "gdprConsentDate", "googleId", "id", "identityDocument", "isSuspended", "isVerified", "kartaPobytuNumber", "lastActiveAt", "lastName", "maxTenants", "name", "passportNumber", "password", "pesel", "phoneNumber", "profession", "profileImage", "requestCount", "responseTime", "role", "signatureBase64", "street", "suspendedAt", "suspensionReason", "updatedAt", "zipCode" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE INDEX "users_role_availability_autoAvailability_currentTenants_idx" ON "users"("role", "availability", "autoAvailability", "currentTenants");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_lastActiveAt_idx" ON "users"("lastActiveAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
