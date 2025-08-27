/*
  Warnings:

  - You are about to drop the column `landlordId` on the `landlord_request_matches` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `leases` table. All the data in the column will be lost.
  - You are about to drop the column `landlordId` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `offers` table. All the data in the column will be lost.
  - You are about to drop the column `landlordId` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `rental_requests` table. All the data in the column will be lost.
  - You are about to drop the column `targetUserId` on the `reviews` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organizationId,rentalRequestId,propertyId]` on the table `landlord_request_matches` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `landlord_request_matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantGroupId` to the `leases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `offers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantGroupId` to the `offers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantGroupId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantGroupId` to the `rent_payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantGroupId` to the `rental_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetTenantGroupId` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."MemberRole" AS ENUM ('OWNER', 'ADMIN', 'AGENT');

-- DropForeignKey
ALTER TABLE "public"."landlord_request_matches" DROP CONSTRAINT "landlord_request_matches_landlordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."leases" DROP CONSTRAINT "leases_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."offers" DROP CONSTRAINT "offers_landlordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."offers" DROP CONSTRAINT "offers_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."properties" DROP CONSTRAINT "properties_landlordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rental_requests" DROP CONSTRAINT "rental_requests_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."reviews" DROP CONSTRAINT "reviews_targetUserId_fkey";

-- DropIndex
DROP INDEX "public"."landlord_request_matches_landlordId_matchScore_idx";

-- DropIndex
DROP INDEX "public"."landlord_request_matches_landlordId_rentalRequestId_propert_key";

-- DropIndex
DROP INDEX "public"."leases_tenantId_idx";

-- DropIndex
DROP INDEX "public"."offers_landlordId_status_idx";

-- DropIndex
DROP INDEX "public"."properties_landlordId_status_idx";

-- DropIndex
DROP INDEX "public"."rental_requests_tenantId_status_idx";

-- DropIndex
DROP INDEX "public"."reviews_targetUserId_idx";

-- AlterTable
ALTER TABLE "public"."landlord_request_matches" DROP COLUMN "landlordId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."leases" DROP COLUMN "tenantId",
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "tenantGroupId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."offers" DROP COLUMN "landlordId",
DROP COLUMN "tenantId",
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "tenantGroupId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "tenantGroupId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."properties" DROP COLUMN "landlordId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."rent_payments" ADD COLUMN     "tenantGroupId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."rental_requests" DROP COLUMN "tenantId",
ADD COLUMN     "tenantGroupId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."reviews" DROP COLUMN "targetUserId",
ADD COLUMN     "targetTenantGroupId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."occupants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "leaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "regNumber" TEXT,
    "address" TEXT NOT NULL,
    "signatureBase64" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organization_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "public"."MemberRole" NOT NULL DEFAULT 'AGENT',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tenant_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tenant_group_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantGroupId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "tenant_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "occupants_leaseId_idx" ON "public"."occupants"("leaseId");

-- CreateIndex
CREATE INDEX "occupants_email_idx" ON "public"."occupants"("email");

-- CreateIndex
CREATE INDEX "organizations_name_idx" ON "public"."organizations"("name");

-- CreateIndex
CREATE INDEX "organizations_taxId_idx" ON "public"."organizations"("taxId");

-- CreateIndex
CREATE INDEX "organizations_regNumber_idx" ON "public"."organizations"("regNumber");

-- CreateIndex
CREATE INDEX "organization_members_userId_idx" ON "public"."organization_members"("userId");

-- CreateIndex
CREATE INDEX "organization_members_organizationId_idx" ON "public"."organization_members"("organizationId");

-- CreateIndex
CREATE INDEX "organization_members_role_idx" ON "public"."organization_members"("role");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_userId_organizationId_key" ON "public"."organization_members"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "tenant_groups_name_idx" ON "public"."tenant_groups"("name");

-- CreateIndex
CREATE INDEX "tenant_group_members_userId_idx" ON "public"."tenant_group_members"("userId");

-- CreateIndex
CREATE INDEX "tenant_group_members_tenantGroupId_idx" ON "public"."tenant_group_members"("tenantGroupId");

-- CreateIndex
CREATE INDEX "tenant_group_members_isPrimary_idx" ON "public"."tenant_group_members"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_group_members_userId_tenantGroupId_key" ON "public"."tenant_group_members"("userId", "tenantGroupId");

-- CreateIndex
CREATE INDEX "landlord_request_matches_organizationId_matchScore_idx" ON "public"."landlord_request_matches"("organizationId", "matchScore");

-- CreateIndex
CREATE UNIQUE INDEX "landlord_request_matches_organizationId_rentalRequestId_pro_key" ON "public"."landlord_request_matches"("organizationId", "rentalRequestId", "propertyId");

-- CreateIndex
CREATE INDEX "leases_tenantGroupId_idx" ON "public"."leases"("tenantGroupId");

-- CreateIndex
CREATE INDEX "leases_organizationId_idx" ON "public"."leases"("organizationId");

-- CreateIndex
CREATE INDEX "offers_tenantGroupId_status_idx" ON "public"."offers"("tenantGroupId", "status");

-- CreateIndex
CREATE INDEX "offers_organizationId_status_idx" ON "public"."offers"("organizationId", "status");

-- CreateIndex
CREATE INDEX "payments_tenantGroupId_status_idx" ON "public"."payments"("tenantGroupId", "status");

-- CreateIndex
CREATE INDEX "properties_organizationId_status_idx" ON "public"."properties"("organizationId", "status");

-- CreateIndex
CREATE INDEX "rent_payments_tenantGroupId_month_year_idx" ON "public"."rent_payments"("tenantGroupId", "month", "year");

-- CreateIndex
CREATE INDEX "rental_requests_tenantGroupId_status_idx" ON "public"."rental_requests"("tenantGroupId", "status");

-- CreateIndex
CREATE INDEX "reviews_targetTenantGroupId_idx" ON "public"."reviews"("targetTenantGroupId");

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rental_requests" ADD CONSTRAINT "rental_requests_tenantGroupId_fkey" FOREIGN KEY ("tenantGroupId") REFERENCES "public"."tenant_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offers" ADD CONSTRAINT "offers_tenantGroupId_fkey" FOREIGN KEY ("tenantGroupId") REFERENCES "public"."tenant_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offers" ADD CONSTRAINT "offers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_tenantGroupId_fkey" FOREIGN KEY ("tenantGroupId") REFERENCES "public"."tenant_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rent_payments" ADD CONSTRAINT "rent_payments_tenantGroupId_fkey" FOREIGN KEY ("tenantGroupId") REFERENCES "public"."tenant_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."landlord_request_matches" ADD CONSTRAINT "landlord_request_matches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_tenantGroupId_fkey" FOREIGN KEY ("tenantGroupId") REFERENCES "public"."tenant_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."occupants" ADD CONSTRAINT "occupants_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "public"."leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_targetTenantGroupId_fkey" FOREIGN KEY ("targetTenantGroupId") REFERENCES "public"."tenant_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tenant_group_members" ADD CONSTRAINT "tenant_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tenant_group_members" ADD CONSTRAINT "tenant_group_members_tenantGroupId_fkey" FOREIGN KEY ("tenantGroupId") REFERENCES "public"."tenant_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
