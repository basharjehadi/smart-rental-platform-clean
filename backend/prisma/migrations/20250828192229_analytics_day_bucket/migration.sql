/*
  Warnings:

  - A unique constraint covering the columns `[location,dateBucket]` on the table `request_pool_analytics` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."request_pool_analytics" ADD COLUMN     "dateBucket" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "properties_status_availability_city_idx" ON "public"."properties"("status", "availability", "city");

-- CreateIndex
CREATE INDEX "properties_status_monthlyRent_idx" ON "public"."properties"("status", "monthlyRent");

-- CreateIndex
CREATE INDEX "properties_status_availableFrom_idx" ON "public"."properties"("status", "availableFrom");

-- CreateIndex
CREATE INDEX "rental_requests_poolStatus_expiresAt_idx" ON "public"."rental_requests"("poolStatus", "expiresAt");

-- CreateIndex
CREATE INDEX "rental_requests_poolStatus_createdAt_idx" ON "public"."rental_requests"("poolStatus", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "request_pool_analytics_location_dateBucket_key" ON "public"."request_pool_analytics"("location", "dateBucket");
