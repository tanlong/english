import { defineConfig } from "@playwright/test";
import path from "node:path";

const databaseUrl = `file:${path.resolve("artifacts/e2e-cache.db")}`;
process.env.DATABASE_URL = databaseUrl;
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:3001", trace: "retain-on-failure" },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: false,
    env: {
      DATABASE_URL: databaseUrl,
      OPENAI_API_KEY: "",
      ENABLE_CLOUD_SPEECH: "false",
      TTS_CACHE_DIR: path.resolve("artifacts/no-legacy-audio"),
    },
    timeout: 30_000,
  },
  reporter: [["list"]],
});
