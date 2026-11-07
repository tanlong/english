CREATE TABLE "CafeConversation" (
 "id" TEXT NOT NULL PRIMARY KEY, "tenantId" TEXT NOT NULL, "learnerId" TEXT NOT NULL,
 "activeKey" TEXT, "npcId" TEXT NOT NULL, "topicId" TEXT NOT NULL, "level" TEXT NOT NULL,
 "useAi" BOOLEAN NOT NULL DEFAULT false, "status" TEXT NOT NULL DEFAULT 'active',
 "busyUntil" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "summaryJson" TEXT,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "endedAt" DATETIME,
 FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CafeConversation_activeKey_key" ON "CafeConversation"("activeKey");
CREATE INDEX "CafeConversation_tenantId_learnerId_createdAt_idx" ON "CafeConversation"("tenantId","learnerId","createdAt");
CREATE TABLE "CafeTurn" (
 "id" TEXT NOT NULL PRIMARY KEY, "conversationId" TEXT NOT NULL, "clientMessageId" TEXT NOT NULL,
 "userText" TEXT NOT NULL, "replyJson" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY ("conversationId") REFERENCES "CafeConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CafeTurn_conversationId_clientMessageId_key" ON "CafeTurn"("conversationId","clientMessageId");
CREATE INDEX "CafeTurn_conversationId_createdAt_idx" ON "CafeTurn"("conversationId","createdAt");
CREATE TABLE "CafeFlashcard" (
 "id" TEXT NOT NULL PRIMARY KEY, "learnerId" TEXT NOT NULL, "conversationId" TEXT NOT NULL,
 "normalizedPhrase" TEXT NOT NULL, "english" TEXT NOT NULL, "vietnamese" TEXT NOT NULL,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 FOREIGN KEY ("conversationId") REFERENCES "CafeConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CafeFlashcard_learnerId_normalizedPhrase_conversationId_key" ON "CafeFlashcard"("learnerId","normalizedPhrase","conversationId");
