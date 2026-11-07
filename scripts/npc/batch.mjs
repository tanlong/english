import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { npcs } from "./registry.mjs";

if (!process.argv.includes("--approved-only") || !process.argv.includes("--draft")) {
  throw new Error(
    "Batch is a review export only. Use --approved-only --draft; production publishing is disabled.",
  );
}
const run = promisify(execFile);
const pilot = JSON.parse(await readFile("art/npc/cloud_daisy/approval.json", "utf8"));
if (!pilot.pilot?.accepted) throw new Error("Cloud Daisy pilot must be accepted before batch.");
for (const npc of npcs) {
  const approval = JSON.parse(await readFile(`art/npc/${npc.id}/approval.json`, "utf8"));
  if (!approval.master?.accepted) {
    console.log(`Skipped ${npc.id}: master not accepted.`);
    continue;
  }
  await run(process.execPath, ["scripts/npc/build-review.mjs", "--npc", npc.id]);
  const result = await run(
    process.execPath,
    ["scripts/npc/export-pilot.mjs", "--npc", npc.id, "--draft"],
    { maxBuffer: 1024 * 1024 },
  );
  console.log(result.stdout.trim());
  await run(process.execPath, ["scripts/npc/pack-draft.mjs", "--npc", npc.id]);
}
await run(process.execPath, ["scripts/npc/build-index.mjs"]);
console.log("Review batch complete. Production art gates remain separate.");
