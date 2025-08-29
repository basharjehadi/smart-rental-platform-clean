-- AlterTable
ALTER TABLE "public"."reviews" ADD COLUMN     "redactedAt" TIMESTAMP(3),
ADD COLUMN     "redactedBy" TEXT,
ADD COLUMN     "stage" "public"."ReviewStage",
ADD COLUMN     "stars" INTEGER,
ADD COLUMN     "targetUserId" TEXT,
ADD COLUMN     "text" TEXT;

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_adminId_idx" ON "public"."audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "audit_logs_resourceType_resourceId_idx" ON "public"."audit_logs"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "public"."audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
