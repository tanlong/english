import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

test("the app can load every configured café scene and NPC asset", async () => {
  const result = spawnSync(process.execPath, ["scripts/npc/pipeline.mjs", "inspect"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const inventory = JSON.parse(await readFile("reports/npc/asset-inventory.json", "utf8"));
  assert.deepEqual(
    inventory.missingRuntimeReferences,
    [],
    "Configured image URLs must have real public files",
  );
});

test("inspect reports missing masters without approving or fabricating artwork", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "npc-pipeline-"));
  try {
    await mkdir(path.join(root, "MD"));
    const result = spawnSync(
      process.execPath,
      ["scripts/npc/pipeline.mjs", "inspect", "--root", root],
      {
        encoding: "utf8",
      },
    );
    assert.equal(result.status, 0, result.stderr);
    const inventory = JSON.parse(
      await readFile(path.join(root, "reports/npc/asset-inventory.json")),
    );
    assert.equal(inventory.npcs.length, 6);
    assert.ok(inventory.npcs.every((npc) => npc.status === "MISSING_MASTER" && !npc.approved));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("QA blocks production export of a generated layer until owner approval", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "npc-gate-"));
  try {
    const result = spawnSync(
      process.execPath,
      ["scripts/npc/pipeline.mjs", "qa", "--root", root, "--npc", "may"],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 1, result.stderr);
    const gate = JSON.parse(
      await readFile(path.join(root, "reports/npc/cloud_daisy/quality-gate.json")),
    );
    assert.equal(gate.productionReady, false);
    assert.ok(gate.blockers.includes("MASTER_NOT_APPROVED"));
    assert.ok(gate.blockers.includes("PILOT_NOT_APPROVED"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("master validation rejects a white background even when the file has an alpha channel", async () => {
  const { validateImage } = await import("./npc/pipeline.mjs");
  const root = await mkdtemp(path.join(tmpdir(), "npc-alpha-"));
  try {
    const file = path.join(root, "opaque.png");
    await sharp({ create: { width: 768, height: 1024, channels: 4, background: "white" } })
      .png()
      .toFile(file);
    const validation = await validateImage(file);
    assert.equal(validation.technicalPass, false);
    assert.ok(validation.errors.includes("OPAQUE_BACKGROUND"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("approved metadata cannot make QA pass when the rig and GIF files do not exist", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "npc-missing-output-"));
  try {
    const png = await sharp({
      create: { width: 768, height: 1024, channels: 4, background: "transparent" },
    })
      .composite([
        {
          input: { create: { width: 400, height: 800, channels: 4, background: "red" } },
          left: 100,
          top: 100,
        },
      ])
      .png()
      .toBuffer();
    const sha256 = createHash("sha256").update(png).digest("hex");
    const dir = path.join(root, "art/npc/cloud_daisy");
    for (const sub of [
      "MD",
      "art/npc/cloud_daisy/source",
      "art/npc/cloud_daisy/parts",
      "art/npc/cloud_daisy/props",
      "reports/npc/cloud_daisy",
    ]) {
      await mkdir(path.join(root, sub), { recursive: true });
    }
    await writeFile(path.join(root, "MD/Cloud Daisy.png"), png);
    await writeFile(path.join(dir, "source/master_rgba.png"), png);
    await writeFile(
      path.join(dir, "model-lock.json"),
      JSON.stringify({ approved: true, masterSha256: sha256 }),
    );
    const parts = {};
    for (const [kind, names] of [
      ["parts", ["body", "arm_wave", "arm_hold", "eyes_closed"]],
      ["props", ["cup", "cloth"]],
    ]) {
      for (const name of names) {
        await writeFile(path.join(dir, kind, `${name}.png`), png);
        parts[name] = { accepted: true, sha256 };
      }
    }
    await writeFile(
      path.join(dir, "approval.json"),
      JSON.stringify({
        master: { accepted: true, sha256, normalizedSha256: sha256 },
        parts,
        pilot: { accepted: true },
        production: { accepted: true },
      }),
    );
    await writeFile(
      path.join(root, "reports/npc/cloud_daisy/export-validation.json"),
      JSON.stringify({ pass: true }),
    );
    const result = spawnSync(process.execPath, ["scripts/npc/pipeline.mjs", "qa", "--root", root], {
      encoding: "utf8",
    });
    assert.equal(result.status, 1, result.stderr);
    const gate = JSON.parse(
      await readFile(path.join(root, "reports/npc/cloud_daisy/quality-gate.json")),
    );
    assert.equal(gate.master.approved, true);
    assert.equal(gate.partsReady, true);
    assert.equal(gate.productionReady, false);
    assert.ok(gate.blockers.includes("RIG_NOT_APPROVED"));
    assert.ok(gate.blockers.includes("GIF_MISSING:idle"));
    assert.ok(gate.blockers.includes("GIF_MISSING:interaction"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
