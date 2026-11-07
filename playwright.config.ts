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
      CONTENT_EDITOR_TOKEN: "E2E-ONLY-EDITOR-KEY-DO-NOT-USE-IN-PRODUCTION",
      CONTENT_REVIEWER_TOKEN: "E2E-ONLY-REVIEWER-KEY-DO-NOT-USE-IN-PRODUCTION",
      CONTENT_ADMIN_TOKEN: "E2E-ONLY-ADMIN-KEY-DO-NOT-USE-IN-PRODUCTION",
      CAFE_TENANT_ID: "local",
      CAFE_ALLOW_LEARNER_AI: "false",
      CAFE_ADMIN_PRINCIPALS: JSON.stringify([
        { token: "E2E-ONLY-CAFE-OWNER-DO-NOT-USE-IN-PRODUCTION", tenantId: "local", role: "owner" },
      ]),
      CAFE_SECRET_KEYS: JSON.stringify({ v1: Buffer.alloc(32, 9).toString("base64") }),
      CAFE_SECRET_KEY_VERSION: "v1",
      CAFE_GROQ_MODELS: "test-model",
      CAFE_GEMINI_MODELS: "",
    },
    timeout: 30_000,
  },
  reporter: [["list"]],
});
