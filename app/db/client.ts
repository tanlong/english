import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.ts";
import { getDatabaseUrl } from "./url.ts";

const database = globalThis as typeof globalThis & {
  englishDatabase?: { url: string; client: PrismaClient };
};

export function getDb() {
  const url = getDatabaseUrl();
  if (database.englishDatabase?.url !== url) {
    database.englishDatabase = {
      url,
      client: new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) }),
    };
  }
  return database.englishDatabase.client;
}
