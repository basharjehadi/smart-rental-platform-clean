-- CreateTable
CREATE TABLE "users" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "rental_requests" (
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

-- CreateTable
CREATE TABLE "offers" (
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
    "contractGenerated" BOOLEAN NOT NULL DEFAULT false,
    "contractGeneratedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "landlordId" TEXT NOT NULL,
    "rentalRequestId" INTEGER NOT NULL,
    CONSTRAINT "offers_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "offers_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "rental_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "purpose" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "rentalRequestId" INTEGER,
    CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "rental_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rent_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" DATETIME NOT NULL,
    "paidDate" DATETIME,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "offerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "rent_payments_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rent_payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contract_signatures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rentalRequestId" INTEGER NOT NULL,
    "tenantSignatureBase64" TEXT,
    "landlordSignatureBase64" TEXT,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contract_signatures_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "rental_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rentalRequestId" INTEGER NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "pdfUrl" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" DATETIME,
    "tenantSignedAt" DATETIME,
    "landlordSignedAt" DATETIME,
    "agreementDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseStartDate" DATETIME NOT NULL,
    "leaseEndDate" DATETIME NOT NULL,
    "rentAmount" REAL NOT NULL,
    "depositAmount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contracts_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "rental_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "offers_rentalRequestId_key" ON "offers"("rentalRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "payments"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "contract_signatures_rentalRequestId_key" ON "contract_signatures"("rentalRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_rentalRequestId_key" ON "contracts"("rentalRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractNumber_key" ON "contracts"("contractNumber");
