import { mkdir, open } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import { getDatabaseUrl } from "../app/db/url.ts";

nextEnv.loadEnvConfig(process.cwd());
const file = getDatabaseUrl().slice(5);
await mkdir(path.dirname(file), { recursive: true });
// Prisma's SQLite schema engine expects the target file to exist on this runtime.
const handle = await open(file, "a");
await handle.close();
