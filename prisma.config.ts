import nextEnv from "@next/env";
import { defineConfig } from "prisma/config";
import { getDatabaseUrl } from "./app/db/url.ts";

nextEnv.loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: getDatabaseUrl() },
});
