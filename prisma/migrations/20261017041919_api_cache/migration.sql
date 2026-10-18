-- CreateTable
CREATE TABLE "TtsAudio" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "requestJson" TEXT,
    "audio" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Transcription" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "model" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
