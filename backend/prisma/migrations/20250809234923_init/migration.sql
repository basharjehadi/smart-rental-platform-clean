-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('TENANT', 'LANDLORD', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."RentalRequestStatus" AS ENUM ('ACTIVE', 'LOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RequestPoolStatus" AS ENUM ('ACTIVE', 'MATCHED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentPurpose" AS ENUM ('DEPOSIT', 'RENT', 'DEPOSIT_AND_FIRST_MONTH');

-- CreateEnum
CREATE TYPE "public"."ContractStatus" AS ENUM ('SIGNED', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PaymentGateway" AS ENUM ('STRIPE', 'PAYU', 'P24', 'TPAY');

-- CreateEnum
CREATE TYPE "public"."PropertyStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RENTED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "public"."KYCStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NOT_SUBMITTED');

-- CreateEnum
CREATE TYPE "public"."LeaseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'TERMINATED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."MaintenanceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ConversationType" AS ENUM ('DIRECT', 'GROUP', 'PROPERTY');

-- CreateEnum
CREATE TYPE "public"."ParticipantRole" AS ENUM ('ADMIN', 'MEMBER', 'READONLY');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."ConversationStatus" AS ENUM ('PENDING', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'TENANT',
    "googleId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "pesel" TEXT,
    "passportNumber" TEXT,
    "kartaPobytuNumber" TEXT,
    "phoneNumber" TEXT,
    "citizenship" TEXT,
    "dateOfBirth" TIMESTAMP(3),
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
    "kycStatus" "public"."KYCStatus" NOT NULL DEFAULT 'PENDING',
    "kycSubmittedAt" TIMESTAMP(3),
    "kycReviewedAt" TIMESTAMP(3),
    "kycRejectionReason" TEXT,
    "kycReviewedBy" TEXT,
    "gdprConsent" BOOLEAN NOT NULL DEFAULT false,
    "gdprConsentDate" TIMESTAMP(3),
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspensionReason" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "availability" BOOLEAN NOT NULL DEFAULT true,
    "autoAvailability" BOOLEAN NOT NULL DEFAULT true,
    "maxTenants" INTEGER NOT NULL DEFAULT 5,
    "currentTenants" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "responseTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."landlord_profiles" (
    "id" TEXT NOT NULL,
    "preferredLocations" TEXT,
    "maxBudget" DOUBLE PRECISION,
    "minBudget" DOUBLE PRECISION,
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
    "acceptanceRate" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landlord_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."properties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Poland',
    "propertyType" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "size" DOUBLE PRECISION,
    "floor" INTEGER,
    "totalFloors" INTEGER,
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "depositAmount" DOUBLE PRECISION,
    "utilitiesIncluded" BOOLEAN NOT NULL DEFAULT false,
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "parking" BOOLEAN NOT NULL DEFAULT false,
    "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "maxTenants" INTEGER NOT NULL DEFAULT 1,
    "currentTenants" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "houseRules" TEXT,
    "images" TEXT,
    "videos" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "landlordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rental_requests" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "moveInDate" TIMESTAMP(3) NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "budgetFrom" DOUBLE PRECISION,
    "budgetTo" DOUBLE PRECISION,
    "propertyType" TEXT,
    "district" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."RentalRequestStatus" NOT NULL DEFAULT 'ACTIVE',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "additionalRequirements" TEXT,
    "preferredNeighborhood" TEXT,
    "maxCommuteTime" TEXT,
    "mustHaveFeatures" TEXT,
    "flexibleOnMoveInDate" BOOLEAN NOT NULL DEFAULT false,
    "poolStatus" "public"."RequestPoolStatus" NOT NULL DEFAULT 'ACTIVE',
    "matchScore" DOUBLE PRECISION,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "parking" BOOLEAN DEFAULT false,
    "petsAllowed" BOOLEAN DEFAULT false,

    CONSTRAINT "rental_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."offers" (
    "id" TEXT NOT NULL,
    "rentAmount" DOUBLE PRECISION NOT NULL,
    "depositAmount" DOUBLE PRECISION,
    "leaseDuration" INTEGER NOT NULL,
    "description" TEXT,
    "utilitiesIncluded" BOOLEAN NOT NULL DEFAULT false,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "status" "public"."OfferStatus" NOT NULL DEFAULT 'PENDING',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentIntentId" TEXT,
    "paymentDate" TIMESTAMP(3),
    "leaseStartDate" TIMESTAMP(3),
    "leaseEndDate" TIMESTAMP(3),
    "propertyAddress" TEXT,
    "propertyImages" TEXT,
    "propertyVideo" TEXT,
    "propertyType" TEXT,
    "propertySize" TEXT,
    "propertyAmenities" TEXT,
    "propertyDescription" TEXT,
    "rulesText" TEXT,
    "rulesPdf" TEXT,
    "preferredPaymentGateway" "public"."PaymentGateway",
    "responseTime" INTEGER,
    "matchScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rentalRequestId" INTEGER NOT NULL,
    "landlordId" TEXT NOT NULL,
    "propertyId" TEXT,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentIntentId" TEXT,
    "purpose" "public"."PaymentPurpose" NOT NULL,
    "gateway" "public"."PaymentGateway" NOT NULL,
    "processingTime" INTEGER,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "rentalRequestId" INTEGER,
    "offerId" TEXT,
    "leaseId" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rent_payments" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "lateFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gracePeriod" INTEGER NOT NULL DEFAULT 5,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT,

    CONSTRAINT "rent_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contract_signatures" (
    "id" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rentalRequestId" INTEGER NOT NULL,

    CONSTRAINT "contract_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contracts" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "status" "public"."ContractStatus" NOT NULL DEFAULT 'SIGNED',
    "pdfUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "generationTime" INTEGER,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rentalRequestId" INTEGER NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."request_pool_analytics" (
    "id" TEXT NOT NULL,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "activeRequests" INTEGER NOT NULL DEFAULT 0,
    "matchedRequests" INTEGER NOT NULL DEFAULT 0,
    "expiredRequests" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTime" INTEGER,
    "averageMatchScore" DOUBLE PRECISION,
    "conversionRate" DOUBLE PRECISION,
    "location" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "landlordCount" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_pool_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."landlord_request_matches" (
    "id" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "matchReason" TEXT,
    "isViewed" BOOLEAN NOT NULL DEFAULT false,
    "isResponded" BOOLEAN NOT NULL DEFAULT false,
    "landlordId" TEXT NOT NULL,
    "rentalRequestId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landlord_request_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."units" (
    "id" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "floor" INTEGER,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "rentAmount" DOUBLE PRECISION NOT NULL,
    "status" "public"."PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leases" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rentAmount" DOUBLE PRECISION NOT NULL,
    "depositAmount" DOUBLE PRECISION NOT NULL,
    "status" "public"."LeaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenance_requests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "public"."MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."MaintenanceStatus" NOT NULL DEFAULT 'PENDING',
    "leaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "type" "public"."ConversationType" NOT NULL DEFAULT 'DIRECT',
    "propertyId" TEXT,
    "offerId" TEXT,
    "status" "public"."ConversationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."ParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "attachmentSize" INTEGER,
    "attachmentType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "public"."users"("googleId");

-- CreateIndex
CREATE INDEX "users_role_availability_autoAvailability_currentTenants_idx" ON "public"."users"("role", "availability", "autoAvailability", "currentTenants");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_lastActiveAt_idx" ON "public"."users"("lastActiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "landlord_profiles_userId_key" ON "public"."landlord_profiles"("userId");

-- CreateIndex
CREATE INDEX "landlord_profiles_preferredLocations_idx" ON "public"."landlord_profiles"("preferredLocations");

-- CreateIndex
CREATE INDEX "landlord_profiles_maxBudget_minBudget_idx" ON "public"."landlord_profiles"("maxBudget", "minBudget");

-- CreateIndex
CREATE INDEX "landlord_profiles_maxTenants_currentTenants_idx" ON "public"."landlord_profiles"("maxTenants", "currentTenants");

-- CreateIndex
CREATE INDEX "landlord_profiles_manualAvailability_autoAvailability_idx" ON "public"."landlord_profiles"("manualAvailability", "autoAvailability");

-- CreateIndex
CREATE INDEX "properties_landlordId_status_idx" ON "public"."properties"("landlordId", "status");

-- CreateIndex
CREATE INDEX "properties_city_status_idx" ON "public"."properties"("city", "status");

-- CreateIndex
CREATE INDEX "properties_propertyType_status_idx" ON "public"."properties"("propertyType", "status");

-- CreateIndex
CREATE INDEX "properties_monthlyRent_status_idx" ON "public"."properties"("monthlyRent", "status");

-- CreateIndex
CREATE INDEX "rental_requests_location_status_poolStatus_idx" ON "public"."rental_requests"("location", "status", "poolStatus");

-- CreateIndex
CREATE INDEX "rental_requests_budget_status_idx" ON "public"."rental_requests"("budget", "status");

-- CreateIndex
CREATE INDEX "rental_requests_createdAt_poolStatus_idx" ON "public"."rental_requests"("createdAt", "poolStatus");

-- CreateIndex
CREATE INDEX "rental_requests_tenantId_status_idx" ON "public"."rental_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "offers_landlordId_status_idx" ON "public"."offers"("landlordId", "status");

-- CreateIndex
CREATE INDEX "offers_rentalRequestId_status_idx" ON "public"."offers"("rentalRequestId", "status");

-- CreateIndex
CREATE INDEX "offers_status_createdAt_idx" ON "public"."offers"("status", "createdAt");

-- CreateIndex
CREATE INDEX "offers_propertyId_idx" ON "public"."offers"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymentIntentId_key" ON "public"."payments"("paymentIntentId");

-- CreateIndex
CREATE INDEX "payments_userId_status_idx" ON "public"."payments"("userId", "status");

-- CreateIndex
CREATE INDEX "payments_status_createdAt_idx" ON "public"."payments"("status", "createdAt");

-- CreateIndex
CREATE INDEX "payments_paymentIntentId_idx" ON "public"."payments"("paymentIntentId");

-- CreateIndex
CREATE INDEX "rent_payments_userId_month_year_idx" ON "public"."rent_payments"("userId", "month", "year");

-- CreateIndex
CREATE INDEX "rent_payments_status_dueDate_idx" ON "public"."rent_payments"("status", "dueDate");

-- CreateIndex
CREATE INDEX "rent_payments_isOverdue_dueDate_idx" ON "public"."rent_payments"("isOverdue", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "contract_signatures_rentalRequestId_key" ON "public"."contract_signatures"("rentalRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractNumber_key" ON "public"."contracts"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_rentalRequestId_key" ON "public"."contracts"("rentalRequestId");

-- CreateIndex
CREATE INDEX "contracts_status_signedAt_idx" ON "public"."contracts"("status", "signedAt");

-- CreateIndex
CREATE INDEX "contracts_contractNumber_idx" ON "public"."contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "request_pool_analytics_location_date_idx" ON "public"."request_pool_analytics"("location", "date");

-- CreateIndex
CREATE INDEX "request_pool_analytics_date_idx" ON "public"."request_pool_analytics"("date");

-- CreateIndex
CREATE INDEX "landlord_request_matches_landlordId_matchScore_idx" ON "public"."landlord_request_matches"("landlordId", "matchScore");

-- CreateIndex
CREATE INDEX "landlord_request_matches_rentalRequestId_matchScore_idx" ON "public"."landlord_request_matches"("rentalRequestId", "matchScore");

-- CreateIndex
CREATE INDEX "landlord_request_matches_isViewed_isResponded_idx" ON "public"."landlord_request_matches"("isViewed", "isResponded");

-- CreateIndex
CREATE UNIQUE INDEX "landlord_request_matches_landlordId_rentalRequestId_key" ON "public"."landlord_request_matches"("landlordId", "rentalRequestId");

-- CreateIndex
CREATE INDEX "units_propertyId_status_idx" ON "public"."units"("propertyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "leases_unitId_key" ON "public"."leases"("unitId");

-- CreateIndex
CREATE INDEX "leases_tenantId_idx" ON "public"."leases"("tenantId");

-- CreateIndex
CREATE INDEX "leases_status_idx" ON "public"."leases"("status");

-- CreateIndex
CREATE INDEX "leases_endDate_idx" ON "public"."leases"("endDate");

-- CreateIndex
CREATE INDEX "reviews_leaseId_idx" ON "public"."reviews"("leaseId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "public"."reviews"("rating");

-- CreateIndex
CREATE INDEX "maintenance_requests_leaseId_status_idx" ON "public"."maintenance_requests"("leaseId", "status");

-- CreateIndex
CREATE INDEX "maintenance_requests_priority_idx" ON "public"."maintenance_requests"("priority");

-- CreateIndex
CREATE INDEX "conversations_propertyId_idx" ON "public"."conversations"("propertyId");

-- CreateIndex
CREATE INDEX "conversations_type_idx" ON "public"."conversations"("type");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "public"."conversations"("status");

-- CreateIndex
CREATE INDEX "conversations_offerId_idx" ON "public"."conversations"("offerId");

-- CreateIndex
CREATE INDEX "conversation_participants_conversationId_idx" ON "public"."conversation_participants"("conversationId");

-- CreateIndex
CREATE INDEX "conversation_participants_userId_idx" ON "public"."conversation_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON "public"."conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "public"."messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "public"."messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_isRead_idx" ON "public"."messages"("isRead");

-- AddForeignKey
ALTER TABLE "public"."landlord_profiles" ADD CONSTRAINT "landlord_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rental_requests" ADD CONSTRAINT "rental_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offers" ADD CONSTRAINT "offers_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offers" ADD CONSTRAINT "offers_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offers" ADD CONSTRAINT "offers_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "public"."rental_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "public"."leases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "public"."rental_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rent_payments" ADD CONSTRAINT "rent_payments_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rent_payments" ADD CONSTRAINT "rent_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_signatures" ADD CONSTRAINT "contract_signatures_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "public"."rental_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "public"."rental_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."landlord_request_matches" ADD CONSTRAINT "landlord_request_matches_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."landlord_request_matches" ADD CONSTRAINT "landlord_request_matches_rentalRequestId_fkey" FOREIGN KEY ("rentalRequestId") REFERENCES "public"."rental_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."units" ADD CONSTRAINT "units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "public"."leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_requests" ADD CONSTRAINT "maintenance_requests_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "public"."leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
