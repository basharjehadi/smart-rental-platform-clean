/*
  Warnings:

  - Added the required column `tenantId` to the `offers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('NEW_RENTAL_REQUEST', 'NEW_OFFER');

-- AlterTable
ALTER TABLE "public"."offers" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "public"."notifications"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "conversations_status_offerId_idx" ON "public"."conversations"("status", "offerId");

-- AddForeignKey
ALTER TABLE "public"."offers" ADD CONSTRAINT "offers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
