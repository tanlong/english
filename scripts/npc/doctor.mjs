import { execFile } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const packages = await Promise.all(
  ["pixi.js", "gsap", "sharp", "@playwright/test"].map(async (name) => {
    try {
      const resolved = fileURLToPath(import.meta.resolve(name));
      let directory = path.dirname(resolved);
      while (true) {
        try {
          const manifest = JSON.parse(await readFile(path.join(directory, "package.json"), "utf8"));
          if (manifest.name === name)
            return { name, installed: true, version: manifest.version, resolved };
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
        const parent = path.dirname(directory);
        if (parent === directory)
          throw new Error("Package manifest not found for resolved module.");
        directory = parent;
      }
    } catch (error) {
      return { name, installed: false, error: error.message };
    }
  }),
);

const binaries = await Promise.all(
  ["ffmpeg", "ffprobe"].map(async (name) => {
    const command = [name, "-version"];
    try {
      const { stdout } = await run(name, ["-version"], { timeout: 5000, maxBuffer: 1024 * 1024 });
      const firstLine = stdout.split(/\r?\n/, 1)[0];
      const version = firstLine.match(/ version (\S+)/)?.[1];
      if (!version) throw new Error("Binary did not report a version.");
      return { name, installed: true, version, command, firstLine };
    } catch (error) {
      return { name, installed: false, command, error: error.message };
    }
  }),
);

let chromium;
try {
  const { chromium: browser } = await import("@playwright/test");
  const executable = browser.executablePath();
  await access(executable, constants.X_OK);
  chromium = {
    name: "chromium",
    installed: true,
    executable,
    check: "executable exists and is executable; browser not launched",
  };
} catch (error) {
  chromium = { name: "chromium", installed: false, error: error.message };
}

const report = {
  checkedAt: new Date().toISOString(),
  command: "npm run npc:doctor",
  nodeVersion: process.version,
  networkCalls: 0,
  apiCalls: 0,
  packages,
  binaries,
  chromium,
  pass: [...packages, ...binaries, chromium].every((entry) => entry.installed),
};
await mkdir("reports/npc", { recursive: true });
await writeFile("reports/npc/toolchain.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.pass) process.exitCode = 1;
