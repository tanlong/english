import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const job = JSON.parse(process.argv[2]);
if (!path.resolve(job.output).startsWith(`${path.resolve("art/dalat")}${path.sep}`))
  throw new Error("Generated Dalat assets must stay inside art/dalat");
await mkdir(path.dirname(job.output), { recursive: true });
await copyFile(job.generatedFile, job.output);
const bytes = await readFile(job.output);
const meta = await sharp(bytes).metadata();
job.sha256 = createHash("sha256").update(bytes).digest("hex");
job.nativeSize = { width: meta.width, height: meta.height };
job.hasAlpha = meta.hasAlpha;
job.tool = "built-in image_gen";
job.model = null;
job.usage = null;
job.costUSD = null;
const file = "art/dalat/generation-jobs-v5.json";
const log = JSON.parse(await readFile(file, "utf8"));
log.jobs.push(job);
await writeFile(file, `${JSON.stringify(log, null, 2)}\n`);
console.log(JSON.stringify({ job: job.jobId, output: job.output, nativeSize: job.nativeSize }));
