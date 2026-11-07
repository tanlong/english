import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { npcs } from "./registry.mjs";

const root = process.cwd();
const out = path.join(root, "reports/npc");
const readJson = async (file) =>
  existsSync(file) ? JSON.parse(await readFile(file, "utf8")) : null;
const sha256 = async (file) =>
  existsSync(file)
    ? createHash("sha256")
        .update(await readFile(file))
        .digest("hex")
    : null;
const escape = (text) =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const href = (file) => path.relative(out, file).split(path.sep).map(encodeURIComponent).join("/");
const link = (file, label) =>
  existsSync(file)
    ? `<a href="${href(file)}">${escape(label)}</a>`
    : `<span class="pending">${escape(label)} · chưa có</span>`;
const generatedAt = new Date().toISOString();
const toolchain = await readJson(path.join(out, "toolchain.json"));
const localArtFile = path.join(
  root,
  existsSync(path.join(root, "reports/dalat/fullhd-manifest-v5.json"))
    ? "reports/dalat/fullhd-manifest-v5.json"
    : "reports/cafe/layered-art-v4.json",
);
const localArt = await readJson(localArtFile);
const entries = [];
const generationRecords = [];

for (const npc of npcs) {
  const art = path.join(root, "art/npc", npc.id);
  const report = path.join(out, npc.id);
  const approval = await readJson(path.join(art, "approval.json"));
  const masterValidation = await readJson(path.join(art, "master-validation.json"));
  const exportValidation = await readJson(path.join(report, "export-validation.json"));
  const rigFile = path.join(art, "rig.json");
  const rig = await readJson(rigFile);
  const rigHash = await sha256(rigFile);
  const masterHash = await sha256(path.join(art, "source/master_rgba.png"));
  const runtimeDir = path.join(art, "draft/runtime");
  const packValidation = await readJson(path.join(runtimeDir, "pack-validation.json"));
  const atlas = await readJson(path.join(runtimeDir, "atlas.json"));
  const runtimeHashChecks = [];
  for (const name of ["atlas.webp", "atlas.json", "rig.json", "animations.json"]) {
    const actualHash = await sha256(path.join(runtimeDir, name));
    runtimeHashChecks.push({
      name,
      exists: actualHash !== null,
      matches: actualHash !== null && packValidation?.fileHashes?.[name] === actualHash,
    });
  }
  const runtimeFrameChecks = [];
  for (const [id, frame] of Object.entries(atlas?.frames ?? {})) {
    const file = typeof frame.sourceFile === "string" ? path.resolve(art, frame.sourceFile) : null;
    const actualHash = file?.startsWith(`${art}${path.sep}`) ? await sha256(file) : null;
    runtimeFrameChecks.push({
      id,
      sourceMatches: actualHash !== null && frame.sourcePngSha256 === actualHash,
    });
  }
  const runtimeDraftPass =
    packValidation?.pass === true &&
    packValidation.rigSha256 === rigHash &&
    packValidation.sourceSha256 === masterHash &&
    runtimeHashChecks.every((file) => file.matches) &&
    runtimeFrameChecks.length > 0 &&
    runtimeFrameChecks.every((frame) => frame.sourceMatches) &&
    packValidation.frames?.length === runtimeFrameChecks.length &&
    packValidation.frames.every(
      (frame) =>
        frame.inBounds &&
        frame.exactPixels &&
        frame.resizedRgbaSha256 === frame.extractedRgbaSha256,
    );
  const missingArt = await readJson(path.join(art, "missing-art.json"));
  const generationLogFile = path.join(art, "jobs/generation-log.json");
  const generationLog = await readJson(generationLogFile);
  for (const job of generationLog?.jobs ?? []) {
    generationRecords.push({
      event: "image_generation_succeeded",
      npcId: npc.id,
      tool: job.tool ?? generationLog.provider ?? "built-in image_gen",
      model:
        typeof job.model === "string" && /not reported|unknown|not returned/i.test(job.model)
          ? null
          : (job.model ?? null),
      usage: job.usage ?? null,
      costUSD: job.costUSD ?? null,
      sourceLog: relative(generationLogFile),
      outputExists: typeof job.output === "string" && existsSync(path.resolve(root, job.output)),
      outputSha256:
        typeof job.output === "string" ? await sha256(path.resolve(root, job.output)) : null,
      sourceJob: job,
    });
  }
  for (const failure of generationLog?.failedAttempts ?? []) {
    generationRecords.push({
      event: "image_generation_failed",
      npcId: npc.id,
      tool: generationLog.provider ?? "built-in image_gen",
      model: null,
      usage: null,
      costUSD: null,
      sourceLog: relative(generationLogFile),
      sourceJob: failure,
    });
  }
  const mouthLogFile = path.join(art, "runtime-v4/generation-job.json");
  const mouthJob = await readJson(mouthLogFile);
  if (mouthJob) {
    const output = path.join(art, "runtime-v4/mouth-closed-source.png");
    generationRecords.push({
      event: "image_generation_succeeded",
      npcId: npc.id,
      type: "mouth_closed",
      tool: mouthJob.tool,
      model: mouthJob.model ?? null,
      usage: mouthJob.usage ?? null,
      costUSD: mouthJob.costUsd ?? null,
      sourceLog: relative(mouthLogFile),
      outputExists: existsSync(output),
      outputSha256: await sha256(output),
      sourceJob: mouthJob,
    });
  }
  const clips = [];
  for (const state of ["idle", "interaction"]) {
    const file = path.join(report, "preview", `${npc.id}_${state}.gif`);
    const checked = exportValidation?.clips?.find((clip) => clip.state === state);
    const fileHash = await sha256(file);
    clips.push({
      state,
      path: relative(file),
      exists: fileHash !== null,
      sha256: fileHash,
      validationPass: checked?.pass === true && fileHash !== null && checked.sha256 === fileHash,
      frames: checked?.frames ?? null,
      durationMs: checked?.durationMs ?? null,
      loop: checked?.loop ?? null,
    });
  }
  const exportPass =
    exportValidation?.pass === true &&
    exportValidation.rigHash === rigHash &&
    clips.every((clip) => clip.validationPass);
  entries.push({
    npcId: npc.id,
    displayName: npc.name,
    masterAccepted: approval?.master?.accepted === true,
    masterHashMatches: masterHash !== null && approval?.master?.sha256 === masterHash,
    masterTechnicalPass: masterValidation?.technicalPass === true,
    pilotAccepted: approval?.pilot?.accepted === true,
    productionAccepted: approval?.production?.accepted === true,
    rigApproved: rig?.approved === true,
    draftLayerCount: rig?.layers?.filter((layer) => !layer.approved).length ?? 0,
    exportStatus: !exportValidation ? "pending" : exportPass ? "pass" : "failed_or_stale",
    exportPass,
    runtimeDraft: {
      exists: packValidation !== null,
      pass: runtimeDraftPass,
      status: packValidation?.status ?? "pending",
      textureCount: runtimeFrameChecks.length,
      fileHashChecks: runtimeHashChecks,
      sourceFrameChecks: runtimeFrameChecks,
    },
    clips,
    motionStatus: rig?.status?.includes("SIGNATURE_PARTIAL")
      ? "signature_partial"
      : (rig?.status ?? "pending"),
    limitations: rig?.limitations ?? [],
    missingArtCount: missingArt?.jobs?.filter((job) => job.status === "MISSING_ART").length ?? null,
    paths: {
      review: relative(path.join(report, "review.html")),
      thumbnail: existsSync(path.join(report, "alpha-light.png"))
        ? relative(path.join(report, "alpha-light.png"))
        : null,
      masterValidation: relative(path.join(art, "master-validation.json")),
      exportValidation: relative(path.join(report, "export-validation.json")),
      missingArt: relative(path.join(art, "missing-art.json")),
      generationLog: relative(path.join(art, "jobs/generation-log.json")),
      approval: relative(path.join(art, "approval.json")),
      rig: relative(rigFile),
      packValidation: relative(path.join(runtimeDir, "pack-validation.json")),
      atlasJson: relative(path.join(runtimeDir, "atlas.json")),
    },
  });
}

const sceneLogFile = path.join(root, "art/scenes/generation-jobs-v4.json");
const sceneLog = await readJson(sceneLogFile);
for (const job of sceneLog?.jobs ?? []) {
  const output = path.resolve(root, job.output);
  generationRecords.push({
    event: "image_generation_succeeded",
    sceneId: job.sceneId,
    type: job.type,
    tool: job.tool,
    model: job.model ?? null,
    usage: job.usage ?? null,
    costUSD: job.costUSD ?? null,
    sourceLog: relative(sceneLogFile),
    outputExists: existsSync(output),
    outputSha256: await sha256(output),
    sourceJob: job,
  });
}

const dalatLogFile = path.join(root, "art/dalat/generation-jobs-v5.json");
const dalatLog = await readJson(dalatLogFile);
for (const job of dalatLog?.jobs ?? []) {
  const output = path.resolve(root, job.output);
  generationRecords.push({
    event: "image_generation_succeeded",
    sceneId: job.sceneId,
    type: job.type,
    tool: job.tool,
    model: job.model ?? null,
    usage: job.usage ?? null,
    costUSD: job.costUSD ?? null,
    sourceLog: relative(dalatLogFile),
    outputExists: existsSync(output),
    outputSha256: await sha256(output),
    sourceJob: job,
  });
}

const summary = {
  generatedAt,
  reportPath: "reports/npc/index.html",
  npcCount: entries.length,
  approvedMasterCount: entries.filter((npc) => npc.masterAccepted).length,
  acceptedPilotCount: entries.filter((npc) => npc.pilotAccepted).length,
  existingGifCount: entries.reduce(
    (total, npc) => total + npc.clips.filter((clip) => clip.exists).length,
    0,
  ),
  targetGifCount: entries.length * 2,
  exportPassCount: entries.filter((npc) => npc.exportPass).length,
  runtimeDraftPassCount: entries.filter((npc) => npc.runtimeDraft.pass).length,
  runtimeDraftPackCount: entries.filter((npc) => npc.runtimeDraft.exists).length,
  runtimeDraftTextureCount: entries.reduce(
    (total, npc) => total + (npc.runtimeDraft.pass ? npc.runtimeDraft.textureCount : 0),
    0,
  ),
  productionAcceptedCount: entries.filter((npc) => npc.productionAccepted).length,
  localIntegration: localArt
    ? {
        renderer: localArt.renderer,
        sceneLayerCount: localArt.sceneLayers.length,
        npcCount: localArt.npcAssets.length,
        report: relative(localArtFile),
        review:
          localArt?.version === "5.0" ? "reports/dalat/review.html" : "reports/cafe/review.html",
      }
    : null,
  generation: {
    tool: "built-in image_gen",
    successfulToolCalls: generationRecords.filter(
      (record) => record.event === "image_generation_succeeded",
    ).length,
    failedToolCalls: generationRecords.filter(
      (record) => record.event === "image_generation_failed",
    ).length,
    totalLoggedToolCalls: generationRecords.length,
    applicationPaidApiCalls: 0,
    model: null,
    usage: null,
    toolCostUSD: null,
    recordsPath: "reports/npc/generated-costs.jsonl",
    note: "Built-in image tool did not report model, usage or USD cost. Unknown values are null, not zero. Original per-job records are preserved in sourceJob.",
  },
  toolchain: toolchain
    ? {
        path: "reports/npc/toolchain.json",
        nodeVersion: toolchain.nodeVersion,
        packages: toolchain.packages,
        binaries: toolchain.binaries,
        chromium: toolchain.chromium,
        pass: toolchain.pass,
      }
    : null,
  npcs: entries,
};

await mkdir(out, { recursive: true });
await writeFile(
  path.join(out, "generated-costs.jsonl"),
  generationRecords.map((record) => JSON.stringify(record)).join("\n") + "\n",
);

const status = (accepted, yes, no) =>
  `<span class="badge ${accepted ? "pass" : "draft"}">${escape(accepted ? yes : no)}</span>`;
const cards = entries
  .map((npc) => {
    const file = (key) => path.join(root, npc.paths[key]);
    const thumbnail = npc.paths.thumbnail
      ? `<img class="thumb" src="${href(file("thumbnail"))}" alt="${escape(npc.displayName)} trên nền sáng" loading="lazy" width="176" height="220">`
      : `<div class="thumb empty">Đang xuất ảnh kiểm tra alpha</div>`;
    const clips = npc.clips
      .map(
        (clip) =>
          `<li>${link(path.join(root, clip.path), clip.state === "idle" ? "Idle GIF" : "Interaction GIF")}<small>${clip.validationPass ? `${clip.frames} khung · ${clip.durationMs / 1000}s · ${clip.loop === 0 ? "lặp" : "một lần"}` : clip.exists ? "File đã có · chờ xác thực bản xuất" : "Đang chờ xuất"}</small></li>`,
      )
      .join("");
    return `<article><div class="card-head"><h2>${escape(npc.displayName)}</h2><code>${escape(npc.npcId)}</code></div>${thumbnail}<div class="badges">${status(npc.masterAccepted, "Master đã duyệt", "Master chờ duyệt")}${status(npc.pilotAccepted, "Pilot đã duyệt", "Pilot chờ duyệt")}${status(npc.exportPass, "Export đạt", npc.exportStatus === "pending" ? "Export đang chờ" : "Export cần kiểm tra")}</div><p class="draft-note">${npc.draftLayerCount} layer rig còn nháp · ${npc.productionAccepted ? "Production đã duyệt" : "Production chưa duyệt"}</p>${npc.motionStatus === "signature_partial" ? '<p class="draft-note">Động tác đặc trưng mới có một phần: <code>signature_partial</code>.</p>' : ""}<p>${link(file("review"), "Mở review tương tác")}</p><ul class="clips">${clips}</ul><details><summary>Giới hạn chuyển động</summary><ul>${npc.limitations.length ? npc.limitations.map((item) => `<li>${escape(item)}</li>`).join("") : "<li>Chưa có rig hoặc chưa ghi giới hạn.</li>"}</ul></details><details><summary>File kiểm tra & đường dẫn</summary><ul class="files">${[
      ["masterValidation", "Master validation"],
      ["exportValidation", "Export validation"],
      ["missingArt", "Missing art"],
      ["generationLog", "Prompt & generation log"],
      ["approval", "Approval"],
      ["rig", "Rig"],
      ["packValidation", "Runtime draft · pack validation"],
      ["atlasJson", "Runtime draft · atlas JSON"],
    ]
      .map(
        ([key, label]) =>
          `<li>${link(file(key), label)}<small>${escape(npc.paths[key])}</small></li>`,
      )
      .join("")}</ul></details></article>`;
  })
  .join("");
const packages = [...(toolchain?.packages ?? []), ...(toolchain?.binaries ?? [])]
  .map(
    (item) =>
      `<tr><td><code>${escape(item.name)}</code></td><td>${escape(item.version ?? (item.installed ? "đã cài" : "chưa cài"))}</td></tr>`,
  )
  .join("");
const timestamp = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
}).format(new Date(generatedAt));
const generationHtml = `<section class="toolchain"><h2>Tạo ảnh & chi phí</h2><p><code>built-in image_gen</code> · ${summary.generation.successfulToolCalls} lượt thành công · ${summary.generation.failedToolCalls} lượt lỗi đã ghi nhận · ${summary.generation.totalLoggedToolCalls} lượt tổng cộng.</p><p>Ứng dụng gọi API trả phí: <b>${summary.generation.applicationPaidApiCalls}</b>. Model, usage và chi phí USD của công cụ: <b>chưa được trả về</b> (<code>null</code>), chưa có tổng chi phí để báo.</p><p>${link(path.join(out, "generated-costs.jsonl"), "Generation & cost log JSONL")}</p><small>Mỗi dòng giữ nguyên bản ghi gốc trong sourceJob, gồm prompt, input/output và metadata nếu log nguồn có. Lượt tạo cốc Cloud Daisy bị lỗi mạng được ghi riêng với lần thử lại thành công.</small></section>`;
const runtimeHtml = `<section class="toolchain"><h2>Runtime draft · ${summary.runtimeDraftPassCount}/${summary.npcCount} bộ đạt kiểm tra</h2><p>Hiện có ${summary.runtimeDraftPackCount} bộ đóng gói riêng trong <code>art/npc/{id}/draft/runtime/</code>, tổng ${summary.runtimeDraftTextureCount} texture trong các bộ đạt kiểm tra. Checksum của rig, master, bốn file đóng gói và ảnh nguồn từng frame được đối chiếu với báo cáo kiểm tra pixel.</p><p>Các pack gốc vẫn là <code>DRAFT_NOT_FOR_PRODUCTION</code>. Theo yêu cầu owner, bản chuyển đổi đã tích hợp vào app cục bộ bằng PixiJS/GSAP, thêm miệng đóng/mở và ba cảnh Đà Lạt nhiều lớp Full HD. Chưa deploy hoặc tự duyệt production. <a href="../dalat/review.html">Xem ảnh cảnh thực tế</a>. Liên kết pack validation và atlas JSON nằm trong từng thẻ nhân vật.</p></section>`;
const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NPC · Báo cáo sản xuất ảnh</title><style>
:root{color-scheme:light;--bg:#f1f3ee;--ink:#19362a;--muted:#52665a;--line:#ced7cd;--accent:#1e6240}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif}main{max-width:1180px;padding:28px;margin:auto}h1{font-size:30px;letter-spacing:-.04em;margin:6px 0 12px}h2{font-size:21px;margin:0}p{margin:10px 0}a{color:var(--accent);text-underline-offset:3px}a:focus-visible,summary:focus-visible{outline:3px solid #9b6b10;outline-offset:4px}small{display:block;color:var(--muted);font-size:12px;overflow-wrap:anywhere}code{font-size:12px;overflow-wrap:anywhere}.eyebrow{font-size:12px;letter-spacing:.12em;font-weight:700}.lede{max-width:850px;color:var(--muted)}.stats{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0}.stat{background:white;border:1px solid var(--line);border-radius:10px;padding:12px 18px;min-width:150px}.stat b{display:block;font-size:27px}.stat span{font-size:13px;color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}article{background:white;border:1px solid var(--line);border-radius:12px;padding:18px;min-width:0}.card-head{min-height:56px}.thumb{display:block;height:220px;max-width:100%;object-fit:contain;margin:14px auto;background:#e9e7df;border-radius:8px}.empty{width:176px;display:flex;align-items:center;text-align:center;padding:18px;font-size:13px;color:var(--muted)}.badges{display:flex;flex-wrap:wrap;gap:6px}.badge{padding:4px 8px;border-radius:5px;font-size:11px;font-weight:650}.pass{background:#dcefe0;color:#185331}.draft{background:#f8ecd0;color:#75510a}.draft-note{font-size:13px;color:var(--muted)}ul{padding-left:20px}.clips{display:flex;justify-content:space-between;gap:15px;list-style:none;padding:0}.clips li{flex:1}details{border-top:1px solid var(--line);font-size:13px;margin-top:14px;padding-top:5px}summary{min-height:44px;display:list-item;align-content:center;cursor:pointer}.files li{margin:10px 0}.pending{color:var(--muted)}.toolchain{margin-top:22px;background:white;border:1px solid var(--line);border-radius:12px;padding:18px}table{border-collapse:collapse;width:100%;max-width:520px;margin:12px 0}td{padding:6px 12px 6px 0;border-bottom:1px solid var(--line)}footer{margin:25px 0;color:var(--muted);font-size:13px}@media(max-width:950px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){main{padding:16px}.grid{grid-template-columns:1fr}.stat{flex:1;min-width:130px}}
</style><main><span class="eyebrow">ENGLISH CAFÉ / NPC ASSET PIPELINE</span><h1>Bộ ảnh & chuyển động của 6 NPC</h1><p class="lede">Mỗi nhân vật có thư mục riêng. Master và pilot được ghi theo quyết định duyệt thực tế; các layer mới vẫn cần duyệt riêng. Mở review hoặc GIF để xem từng nhân vật.</p><div class="stats"><div class="stat"><b>${summary.approvedMasterCount}/${summary.npcCount}</b><span>Master đã duyệt</span></div><div class="stat"><b>${summary.existingGifCount}/${summary.targetGifCount}</b><span>File GIF hiện có</span></div><div class="stat"><b>${summary.exportPassCount}/${summary.npcCount}</b><span>Bộ export đạt kiểm tra</span></div><div class="stat"><b>${summary.acceptedPilotCount}/${summary.npcCount}</b><span>Pilot đã duyệt</span></div></div><div class="grid">${cards}</div><section class="toolchain"><h2>Công cụ hiện có</h2><p>Node ${escape(toolchain?.nodeVersion ?? "chưa kiểm tra")} · Chromium ${toolchain?.chromium?.installed ? "đã có executable" : "chưa xác nhận"}</p><table><tbody>${packages || "<tr><td>Chưa có báo cáo toolchain.</td></tr>"}</tbody></table><p>${link(path.join(out, "toolchain.json"), "Toolchain JSON")} · ${link(path.join(out, "summary.json"), "Summary JSON")} · ${link(path.join(out, "asset-inventory.json"), "Asset inventory")}</p><small>Phiên bản lấy từ báo cáo doctor. Bộ mã hóa và renderer thực dùng được ghi riêng trong export-validation của từng NPC.</small></section><footer>Cập nhật ${escape(timestamp)} (Việt Nam). Thống kê đọc từ file hiện có; file GIF chỉ tính khi tồn tại, export đạt khi checksum và rig khớp báo cáo. Chạy lại <code>node scripts/npc/build-index.mjs</code> để cập nhật.</footer></main></html>`;

await writeFile(path.join(out, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
await writeFile(
  path.join(out, "index.html"),
  html.replace(
    '<section class="toolchain">',
    `${runtimeHtml}${generationHtml}<section class="toolchain">`,
  ),
);
console.log(
  `NPC report: ${summary.existingGifCount}/${summary.targetGifCount} GIF files; ${summary.exportPassCount}/${summary.npcCount} export sets pass. Open reports/npc/index.html`,
);
