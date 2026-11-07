CREATE TABLE "CafeConnection" (
 "id" TEXT NOT NULL PRIMARY KEY, "tenantId" TEXT NOT NULL, "provider" TEXT NOT NULL,
 "model" TEXT NOT NULL, "ciphertext" TEXT NOT NULL, "keyVersion" TEXT NOT NULL,
 "revision" INTEGER NOT NULL DEFAULT 1, "status" TEXT NOT NULL DEFAULT 'draft', "enabled" BOOLEAN NOT NULL DEFAULT false,
 "dailyRequests" INTEGER NOT NULL, "userDailyRequests" INTEGER NOT NULL, "timeoutMs" INTEGER NOT NULL,
 "maxOutputTokens" INTEGER NOT NULL, "retryAt" DATETIME, "testingUntil" DATETIME, "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "CafeConnection_tenantId_provider_key" ON "CafeConnection"("tenantId", "provider");
CREATE TABLE "CafeUsage" (
 "tenantId" TEXT NOT NULL, "provider" TEXT NOT NULL, "day" TEXT NOT NULL, "subject" TEXT NOT NULL,
 "requests" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("tenantId", "provider", "day", "subject")
);
CREATE TABLE "CafeAudit" (
 "id" TEXT NOT NULL PRIMARY KEY, "tenantId" TEXT NOT NULL, "provider" TEXT NOT NULL,
 "actor" TEXT NOT NULL, "action" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "CafeAudit_tenantId_createdAt_idx" ON "CafeAudit"("tenantId", "createdAt");
