import path from "node:path";

export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || "file:./prisma/cache.db";
  if (!url.startsWith("file:")) throw new Error("DATABASE_URL must use a local SQLite file.");
  return `file:${path.resolve(url.slice(5))}`;
}
