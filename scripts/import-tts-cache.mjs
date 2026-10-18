import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import { getDb } from "../app/db/client.ts";

nextEnv.loadEnvConfig(process.cwd());
const directory = process.env.TTS_CACHE_DIR || path.join(process.cwd(), ".cache", "tts");
const files = await readdir(directory).catch((error) => {
  if (error.code === "ENOENT") return [];
  throw error;
});
const db = getDb();
let imported = 0;
try {
  for (const file of files) {
    if (!/^[a-f0-9]{64}\.mp3$/.test(file)) continue;
    const audio = await readFile(path.join(directory, file));
    if (!audio.byteLength || audio.byteLength > 5 * 1024 * 1024) continue;
    await db.ttsAudio.upsert({
      where: { key: file.slice(0, -4) },
      create: { key: file.slice(0, -4), audio },
      update: {},
    });
    imported++;
  }
  console.log(`SQLite cache ready; ${imported} existing MP3 files preserved.`);
} finally {
  await db.$disconnect();
}
