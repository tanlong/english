CREATE TABLE "ContentDocument" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "draftJson" TEXT NOT NULL,
  "publishedJson" TEXT,
  "updatedAt" DATETIME NOT NULL
);
CREATE TABLE "ContentAudit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "documentId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "actor" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "dataJson" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ContentAudit_documentId_createdAt_idx" ON "ContentAudit"("documentId", "createdAt");
CREATE TABLE "CoreLexicon" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dataJson" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
