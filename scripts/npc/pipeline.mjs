import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { npcs, resolveNpc } from "./registry.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = async (file, fallback = null) =>
  existsSync(file) ? JSON.parse(await readFile(file, "utf8")) : fallback;
const json = async (file, data) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
};

export async function validateImage(file) {
  if (!existsSync(file))
    return { status: "MISSING_MASTER", technicalPass: false, errors: ["MISSING_MASTER"] };
  const bytes = await readFile(file);
  const metadata = await sharp(bytes).metadata();
  const { data, info } = await sharp(bytes)
    .toColourspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width,
    top = info.height,
    right = -1,
    bottom = -1;
  let transparent = 0,
    semiTransparent = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha === 0) transparent++;
      else if (alpha < 255) semiTransparent++;
      if (alpha > 16) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  const errors = [];
  if (metadata.format !== "png") errors.push("NOT_PNG");
  if (metadata.channels !== 4) errors.push("NOT_RGBA");
  if (!metadata.hasAlpha || transparent === 0) errors.push("OPAQUE_BACKGROUND");
  if (right < 0) errors.push("EMPTY_IMAGE");
  if (info.width < 768 || info.height < 1024) errors.push("INSUFFICIENT_RESOLUTION");
  const margins =
    right < 0
      ? null
      : { left, top, right: info.width - 1 - right, bottom: info.height - 1 - bottom };
  const lowPadding =
    margins &&
    (Math.min(margins.left, margins.right) / info.width < 0.06 ||
      Math.min(margins.top, margins.bottom) / info.height < 0.06);
  return {
    status: errors.length ? "INVALID_MASTER" : "TECHNICAL_PASS_VISUAL_REVIEW_REQUIRED",
    technicalPass: errors.length === 0,
    sha256: hash(bytes),
    bytes: bytes.length,
    width: info.width,
    height: info.height,
    channels: metadata.channels,
    hasAlpha: metadata.hasAlpha,
    transparentPixels: transparent,
    semiTransparentPixels: semiTransparent,
    bbox: right < 0 ? null : { left, top, width: right - left + 1, height: bottom - top + 1 },
    margins,
    errors,
    warnings: lowPadding ? ["PADDING_BELOW_6_PERCENT"] : [],
    visualReview: [
      "identity",
      "no ground shadow",
      "no text",
      "full silhouette",
      "halo on light/dark/cafe backgrounds",
    ],
  };
}

async function inspect(root) {
  const inventory = [];
  for (const npc of npcs) {
    const dir = path.join(root, "art/npc", npc.id);
    const source = path.join(root, "MD", `${npc.name}.png`);
    const validation = await validateImage(source);
    const approval = await readJson(path.join(dir, "approval.json"));
    const approved =
      approval?.master?.accepted === true && approval.master.sha256 === validation.sha256;
    const entry = {
      npcId: npc.id,
      displayName: npc.name,
      legacyAlias: npc.alias ?? null,
      source: `MD/${npc.name}.png`,
      approved,
      status: validation.technicalPass
        ? approved
          ? "APPROVED_MASTER"
          : "AWAITING_OWNER_APPROVAL"
        : validation.status,
      ...validation,
      assetStatus: validation.technicalPass
        ? approved
          ? "APPROVED_MASTER"
          : "AWAITING_OWNER_APPROVAL"
        : validation.status,
    };
    entry.status = entry.assetStatus;
    inventory.push(entry);
    if (existsSync(source)) {
      await mkdir(path.join(dir, "reference"), { recursive: true });
      const target = path.join(dir, "reference", `${validation.sha256}.png`);
      if (!existsSync(target)) await copyFile(source, target);
    }
    await json(path.join(dir, "master-validation.json"), validation);
    await json(path.join(dir, "model-lock.json"), {
      schemaVersion: "3.0",
      npcId: npc.id,
      displayName: npc.name,
      aliases: npc.alias ? [npc.alias] : [],
      approved,
      masterPath: approved ? `art/npc/${npc.id}/source/master_rgba.png` : null,
      masterSha256: validation.sha256 ?? null,
      sourcePath: entry.source,
      angle: "three-quarter-front",
      light: "upper-right",
      camera: "fixed",
      designConstraints: {
        species: npc.species,
        outfit: "exactly as supplied reference; do not infer from legacy prompts",
        preserve: ["palette", "silhouette", "face", "costume", "markings"],
      },
      approval: approval?.master ?? { accepted: false, owner: null, timestamp: null },
      assetStatus: entry.status,
    });
    if (!approval)
      await json(path.join(dir, "approval.json"), {
        schemaVersion: "3.0",
        master: { accepted: false, sha256: validation.sha256 ?? null },
        parts: {},
        pilot: { accepted: false },
        production: { accepted: false },
      });
    await checkParts(root, npc);
  }
  const md = existsSync(path.join(root, "MD")) ? await readdir(path.join(root, "MD")) : [];
  const excluded = md.filter(
    (name) => name.endsWith(".png") && !npcs.some((npc) => name === `${npc.name}.png`),
  );
  const runtimeRefs = [];
  for (const manifest of ["app/cafe/npc-assets.json", "configs/scenes.json"]) {
    if (!existsSync(path.join(root, manifest))) continue;
    const content = await readFile(path.join(root, manifest), "utf8");
    for (const src of [...new Set(content.match(/\/cafe\/[^"\s]+\.(?:png|webp|svg|gif)/g))]) {
      if (!existsSync(path.join(root, "public", src))) runtimeRefs.push({ manifest, src });
    }
  }
  const result = {
    schemaVersion: "3.0",
    npcs: inventory,
    excludedFromSixNpcScope: excluded,
    missingRuntimeReferences: runtimeRefs,
    paidApiCalls: 0,
  };
  await json(path.join(root, "reports/npc/asset-inventory.json"), result);
  await json(path.join(root, "reports/npc/missing-art.json"), {
    npcs: await Promise.all(
      npcs.map((npc) => readJson(path.join(root, "art/npc", npc.id, "missing-art.json"))),
    ),
  });
  console.log(
    `Inspected ${inventory.length} NPCs; ${inventory.filter((npc) => npc.approved).length} approved masters; ${runtimeRefs.length} missing runtime references.`,
  );
  return result;
}

async function checkParts(root, npc) {
  const dir = path.join(root, "art/npc", npc.id);
  const approval = await readJson(path.join(dir, "approval.json"), {});
  const jobs = [];
  for (const [kind, names] of [
    ["parts", npc.parts],
    ["props", npc.props],
  ]) {
    for (const name of names) {
      const relative = `${kind}/${name}.png`;
      const file = path.join(dir, relative);
      const exists = existsSync(file);
      const sha256 = exists ? hash(await readFile(file)) : null;
      const approved =
        exists &&
        approval.parts?.[name]?.accepted === true &&
        approval.parts[name].sha256 === sha256;
      const draftPath = `draft/${relative}`;
      const hasDraft = existsSync(path.join(dir, draftPath));
      jobs.push({
        id: name,
        kind,
        path: relative,
        sha256,
        draftPath: hasDraft ? draftPath : null,
        status: approved
          ? "APPROVED"
          : exists || hasDraft
            ? "AWAITING_PART_APPROVAL"
            : "MISSING_ART",
        approved,
        action: kind === "props" ? "GENERATE_PROP" : "ISOLATE_OR_RECONSTRUCT_PART",
        prompt: `Use the approved ${npc.name} master as the sole identity reference. Create ONLY ${name.replaceAll("_", " ")} as one isolated ${kind === "props" ? "prop" : "rig layer"}. Preserve exact species, paws/limbs, palette, outfit, line weight, soft cel shading and three-quarter front view. Reconstruct hidden joint pixels only where necessary. True transparent PNG, full part visible with padding. No labels, floor shadow, background or extra objects. Do not redesign the character. Human review is required.`,
      });
    }
  }
  const result = { npcId: npc.id, ready: jobs.every((job) => job.approved), jobs };
  await json(path.join(dir, "missing-art.json"), result);
  return result;
}

async function validateMaster(root, npc) {
  const dir = path.join(root, "art/npc", npc.id);
  const lock = await readJson(path.join(dir, "model-lock.json"));
  const file = path.join(dir, "source/master_rgba.png");
  const validation = await validateImage(file);
  const approval = await readJson(path.join(dir, "approval.json"));
  const source = path.join(root, "MD", `${npc.name}.png`);
  const sourceHash = existsSync(source) ? hash(await readFile(source)) : null;
  const errors = [...validation.errors];
  if (!lock?.approved || !approval?.master?.accepted) errors.push("MASTER_NOT_APPROVED");
  if (!sourceHash || lock?.masterSha256 !== sourceHash || approval?.master?.sha256 !== sourceHash)
    errors.push("SOURCE_HASH_MISMATCH");
  if (approval?.master?.normalizedSha256 !== validation.sha256)
    errors.push("NORMALIZED_HASH_MISMATCH");
  const result = {
    ...validation,
    technicalPass: errors.length === 0,
    errors,
    approved: errors.length === 0,
    npcId: npc.id,
  };
  await json(path.join(dir, "master-validation.json"), result);
  return result;
}

export async function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  const arg = (name, fallback) => {
    const index = argv.indexOf(`--${name}`);
    return index < 0 ? fallback : argv[index + 1];
  };
  const root = path.resolve(arg("root", process.cwd()));
  const npc = resolveNpc(arg("npc", "cloud_daisy"));
  if (command === "inspect") return inspect(root);
  if (command === "qa") {
    const dir = path.join(root, "art/npc", npc.id);
    const master = await validateMaster(root, npc);
    const parts = await checkParts(root, npc);
    const approval = await readJson(path.join(dir, "approval.json"), {});
    const blockers = [];
    if (!master.approved) blockers.push("MASTER_NOT_APPROVED", ...master.errors);
    if (!parts.ready) blockers.push("PARTS_NOT_APPROVED");
    if (!approval.pilot?.accepted) blockers.push("PILOT_NOT_APPROVED");
    if (!approval.production?.accepted) blockers.push("PRODUCTION_NOT_APPROVED");
    const preview = await readJson(
      path.join(root, "reports/npc", npc.id, "export-validation.json"),
    );
    if (!preview?.pass) blockers.push("GIF_EXPORT_NOT_VALIDATED");
    const rigFile = path.join(dir, "rig.json");
    const rig = await readJson(rigFile);
    const rigHash = existsSync(rigFile) ? hash(await readFile(rigFile)) : null;
    if (!rig?.approved || !rig.layers?.length) blockers.push("RIG_NOT_APPROVED");
    if (!rigHash || preview?.rigHash !== rigHash) blockers.push("RIG_HASH_MISMATCH");
    if (rig?.sourceHash !== master.sha256) blockers.push("RIG_SOURCE_MISMATCH");
    const safeFile = (base, relative) => {
      if (typeof relative !== "string") return null;
      const file = path.resolve(base, relative);
      return file.startsWith(`${path.resolve(base)}${path.sep}`) ? file : null;
    };
    for (const layer of rig?.layers ?? []) {
      const file = safeFile(dir, layer.file);
      const sha256 = file && existsSync(file) ? hash(await readFile(file)) : null;
      const approved = approval.parts?.[layer.id];
      const rendered = preview?.renderedLayers?.find((entry) => entry.file === layer.file);
      if (
        !sha256 ||
        !layer.approved ||
        !approved?.accepted ||
        approved.file !== layer.file ||
        approved.sha256 !== sha256
      )
        blockers.push(`RENDERED_LAYER_NOT_APPROVED:${layer.id}`);
      if (!sha256 || rendered?.sha256 !== sha256)
        blockers.push(`RENDERED_LAYER_HASH_MISMATCH:${layer.id}`);
    }
    for (const state of ["idle", "interaction"]) {
      const clip = preview?.clips?.find((entry) => entry.state === state);
      const file = safeFile(root, clip?.path);
      if (!file || !existsSync(file)) {
        blockers.push(`GIF_MISSING:${state}`);
        continue;
      }
      const bytes = await readFile(file);
      const meta = await sharp(bytes, { animated: true }).metadata();
      const expected = rig?.clips?.[state];
      const duration = (meta.delay ?? []).reduce((a, b) => a + b, 0);
      if (
        !expected ||
        clip.sha256 !== hash(bytes) ||
        meta.pages !== expected.duration * expected.fps ||
        duration !== expected.duration * 1000 ||
        meta.loop !== (state === "idle" ? 0 : 1)
      )
        blockers.push(`GIF_INVALID:${state}`);
    }
    const previewHash = preview ? hash(Buffer.from(JSON.stringify(preview))) : null;
    for (const stage of ["pilot", "production"]) {
      if (approval[stage]?.rigHash !== rigHash || approval[stage]?.previewHash !== previewHash)
        blockers.push(`${stage.toUpperCase()}_APPROVAL_HASH_MISMATCH`);
    }
    const runtimeFile = safeFile(root, rig?.runtime?.manifest);
    if (!runtimeFile || !existsSync(runtimeFile)) {
      blockers.push("RUNTIME_NOT_PACKAGED");
    } else {
      const runtimeHash = hash(await readFile(runtimeFile));
      if (rig.runtime.sha256 !== runtimeHash || approval.production?.runtimeSha256 !== runtimeHash)
        blockers.push("RUNTIME_HASH_MISMATCH");
    }
    const result = {
      npcId: npc.id,
      productionReady: blockers.length === 0,
      blockers: [...new Set(blockers)],
      master,
      partsReady: parts.ready,
      preview,
      paidApiCalls: 0,
      humanReviewRequired: true,
    };
    await json(path.join(root, "reports/npc", npc.id, "quality-gate.json"), result);
    console.log(JSON.stringify(result, null, 2));
    if (!result.productionReady) process.exitCode = 1;
    return result;
  }
  if (command === "validate-master") {
    const result = await validateMaster(root, npc);
    console.log(JSON.stringify(result, null, 2));
    if (!result.approved) process.exitCode = 1;
    return result;
  }
  if (command === "check-parts" || command === "generate-missing") {
    if (argv.includes("--allow-api"))
      throw new Error(
        "Paid API execution is disabled. Use built-in imagegen with the approved master; this command only writes dry-run jobs.",
      );
    const result = await checkParts(root, npc);
    if (command === "generate-missing")
      await json(path.join(root, "art/npc", npc.id, "jobs/dry-run.json"), {
        dryRun: true,
        remoteCalls: 0,
        ...result,
      });
    console.log(JSON.stringify(result, null, 2));
    return result;
  }
  throw new Error(
    `Unknown command: ${command}. Use inspect, validate-master, check-parts or generate-missing.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
