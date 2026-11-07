import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";

const run = promisify(execFile);
const temporary = await mkdtemp(path.join(os.tmpdir(), "gray-boo-scene-"));
const out = "reports/gray-boo-pine-lake";
const baseURL = process.env.CAFE_PREVIEW_URL || "http://127.0.0.1:3000";
const animation = JSON.parse(await readFile("configs/mountain_view.animation.json", "utf8"));
const duration = animation.boat.periodMs / 1000;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1356, height: 1024 },
    reducedMotion: "no-preference",
    recordVideo: { dir: temporary, size: { width: 1356, height: 1024 } },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() =>
    localStorage.setItem(
      "natural-english:v2",
      JSON.stringify({
        version: 2,
        profile: {
          name: "Linh",
          role: "general",
          goal: "both",
          confidence: "some",
          largeText: false,
          mic: false,
        },
        activeWeek: 1,
        activeDay: 1,
        sessions: {},
        dailySeconds: {},
      }),
    ),
  );
  await page.goto(`${baseURL}/english/cafe`);
  await page.getByRole("button", { name: "Đến đồi chè", exact: true }).click();
  await page.getByRole("button", { name: "Đến hồ thông", exact: true }).click();
  await page.getByRole("button", { name: "Trò chuyện với Gray Boo", exact: true }).waitFor();
  await page
    .locator(".cafe-scene-frame img")
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  await page.locator('.cafe-scene-person [data-renderer="pixi"]').waitFor();
  const scene = page.locator(".cafe-scene-frame");
  const box = await scene.boundingBox();
  if (!box || box.y + box.height > 1024) throw new Error("Scene must fit the recording viewport");
  await scene.screenshot({ path: `${out}/desktop.png` });
  // Capture normal ambient motion, without simulated hover, seeking or faster playback.
  await page.mouse.move(0, 0);
  let remaining = (duration + 2) * 1000;
  while (remaining > 0) {
    const chunk = Math.min(20000, remaining);
    await page.waitForTimeout(chunk);
    remaining -= chunk;
    console.log(`Captured ${Math.round(duration + 2 - remaining / 1000)}s of ${duration + 2}s.`);
  }
  const endBoatTime = await page.evaluate(
    () =>
      Number(
        document.getAnimations().find((a) => a.id.startsWith("pine-lake-boat:"))?.currentTime ?? 0,
      ) / 1000,
  );
  const phaseStart = Math.max(0, endBoatTime - duration);
  const video = page.video();
  await context.close();
  const rawVideo = await video.path();
  const file = `${out}/scene-motion.mp4`;
  await run("ffmpeg", [
    "-y",
    "-sseof",
    `-${duration}`,
    "-i",
    rawVideo,
    "-vf",
    `crop=${Math.floor(box.width / 2) * 2}:${Math.floor(box.height / 2) * 2}:${Math.round(box.x)}:${Math.round(box.y)},scale=1280:720`,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    file,
  ]);
  const detail = `${out}/rower-across-lake.mp4`;
  const leg = animation.boat.legMs / 1000,
    turn = animation.boat.turnMs / 1000;
  const u = `mod(t+${phaseStart.toFixed(3)},${duration})`;
  const fraction = `if(lt(${u},${leg}),${u}/${leg},if(lt(${u},${leg + turn}),1,if(lt(${u},${2 * leg + turn}),(${2 * leg + turn}-${u})/${leg},0)))`;
  const x = `max(0,min(iw-320,(${animation.boat.x}+${animation.boat.destination.x - animation.boat.x}*(${fraction})+${animation.boat.displayWidth / 2})*2/3-160))`;
  const y = `max(0,min(ih-160,(${animation.boat.y}+${animation.boat.destination.y - animation.boat.y}*(${fraction}))*2/3-90))`;
  await run("ffmpeg", [
    "-y",
    "-i",
    file,
    "-vf",
    `crop=320:160:x='${x}':y='${y}',scale=1280:640`,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "19",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    detail,
  ]);
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration,size",
    "-show_entries",
    "stream=width,height,codec_name",
    "-of",
    "json",
    file,
  ]);
  const media = JSON.parse(stdout);
  if (
    errors.length ||
    Number(media.format.duration) < duration - 0.1 ||
    media.streams[0].width !== 1280
  )
    throw new Error(`Invalid scene recording: ${JSON.stringify({ errors, media })}`);
  await writeFile(
    `${out}/scene-recording.json`,
    JSON.stringify(
      {
        file,
        detail,
        detailDescription:
          "Magnified crop following the boat across the same real-time recording; playback speed is unchanged and the runtime camera stays fixed.",
        boatPhaseAtClipStart: phaseStart,
        baseURL,
        source: "Actual Cafe Pine Lake runtime; normal 1× playback",
        media,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Recorded ${file}: ${media.format.duration}s, 1280×720.`);
} finally {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}
