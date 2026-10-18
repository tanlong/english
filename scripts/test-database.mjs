import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getDb } from "../app/db/client.ts";

export async function createTestDatabase() {
  const originalUrl = process.env.DATABASE_URL;
  const directory = await mkdtemp(path.join(tmpdir(), "english-api-cache-"));
  process.env.DATABASE_URL = `file:${path.join(directory, "test.db")}`;
  await writeFile(path.join(directory, "test.db"), "");
  try {
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
      env: process.env,
      stdio: "pipe",
    });
  } catch (error) {
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
  const db = getDb();
  return {
    db,
    async close() {
      await db.$disconnect();
      if (originalUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalUrl;
      await rm(directory, { recursive: true, force: true });
    },
  };
}
