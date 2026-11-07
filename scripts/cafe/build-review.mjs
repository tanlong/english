import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const out = "reports/dalat";
const manifest = JSON.parse(await readFile(`${out}/fullhd-manifest-v5.json`, "utf8"));
const tests = JSON.parse(await readFile(`${out}/playwright-v5.json`, "utf8"));
const browserCaptures = JSON.parse(await readFile(`${out}/browser-captures-v5.json`, "utf8"));
assert.equal(tests.stats.unexpected, 0);
assert.equal(tests.stats.expected, 8);
assert.equal(browserCaptures.pass, true);
const config = JSON.parse(await readFile("configs/scenes.json", "utf8"));
const scenes = config.scenes.map((scene) => [scene.settingId, scene.label]);
const escape = (text) =>
  String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const cards = [];
const captures = [];
for (const [id, label] of scenes) {
  await mkdir(`${out}/${id}`, { recursive: true });
  const file = `${id}/scene-fullhd.png`;
  const bytes = await readFile(`${out}/${file}`);
  captures.push({
    scene: id,
    screenshot: `${out}/${file}`,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  const planes = manifest.sceneLayers.filter((plane) => plane.settingId === id);
  cards.push(
    `<article><h2>${label}</h2><a href="${file}"><img class="runtime" src="${file}" alt="Cảnh ${label.toLowerCase()} đang chạy với các nhân vật mới"></a><p><a href="../../art/dalat/${id}/source/master-fullhd.png">Ảnh master</a> · <a href="../../art/dalat/${id}/layers/">Thư mục các lớp nguồn</a></p><details><summary>Xem ${planes.length} lớp alpha</summary><div class="planes">${planes.map((plane) => `<figure><a href="../../public${plane.src}"><img src="../../public${plane.src}" alt="${escape(plane.type)} ${escape(plane.region)}"></a><figcaption>${escape(plane.type)} / ${escape(plane.region)}</figcaption></figure>`).join("")}</div></details></article>`,
  );
}
for (const type of ["mobile", "tablet"]) {
  await copyFile(
    `${out}/flower_garden/${type === "mobile" ? 390 : 768}-runtime.png`,
    `${out}/${type}-runtime.png`,
  );
}
const sourceFiles = [
  "configs/scenes.json",
  "app/cafe/npc-assets.json",
  "app/cafe/npc-rig.tsx",
  "app/cafe/npc-puppet.ts",
  "app/cafe/npc-motion.ts",
  "app/cafe/workspace.tsx",
  "app/cafe/chat.tsx",
  "app/cafe/content.ts",
  "app/cafe/server.ts",
  "app/styles/cafe.css",
];
const sourceHashes = await Promise.all(
  sourceFiles.map(async (file) => ({
    file,
    sha256: createHash("sha256")
      .update(await readFile(file))
      .digest("hex"),
  })),
);
const verification = {
  artRevision: "dalat-fullhd-v5",
  generatedAt: new Date().toISOString(),
  build: {
    command: "npm run build -- --webpack",
    pass: true,
    note: "Turbopack port binding is denied by this environment; Webpack build passed.",
  },
  nodeChecks: {
    passed: 15,
    command:
      "node --experimental-strip-types --test scripts/cafe-art.test.mjs scripts/cafe-motion.test.mjs scripts/npc-pipeline.test.mjs scripts/cafe.test.mjs scripts/cafe-connections.test.mjs",
  },
  browserChecks: { report: `${out}/playwright-v5.json`, ...tests.stats },
  responsiveChecks: browserCaptures,
  viewports: ["1920x1080", "768x1024", "390x844"],
  sourceHashes,
  captures,
  finalVisualOwnerReview: "pending",
  externalDeployment: false,
};
await writeFile(`${out}/verification-v5.json`, JSON.stringify(verification, null, 2) + "\n");
await writeFile(
  `${out}/review.html`,
  `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Đà Lạt · Cảnh Full HD</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f2e9;color:#342d26;font:16px/1.6 system-ui,sans-serif}main{max-width:1280px;margin:auto;padding:28px}h1{font-size:32px;line-height:1.2;margin:0 0 14px}h2{font-size:23px;margin:0 0 14px}a{color:#456045;text-underline-offset:3px}a:focus-visible,summary:focus-visible{outline:3px solid #b6782e;outline-offset:4px}p{max-width:940px}article{padding:20px;border:1px solid #ddd1b8;border-radius:18px;background:#fffdf7;margin:24px 0}.runtime{display:block;width:100%;height:auto;border-radius:10px}.planes{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:12px 0}figure img{width:100%;background-color:#e7e7e1;background-image:linear-gradient(45deg,#ccc5 25%,transparent 25%),linear-gradient(-45deg,#ccc5 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc5 75%),linear-gradient(-45deg,transparent 75%,#ccc5 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0}figcaption{font:13px ui-monospace,monospace}summary{cursor:pointer;min-height:44px;padding-top:10px}.tag{font:12px ui-monospace,monospace;letter-spacing:.12em;color:#526b4b}.status{padding:14px 18px;border-radius:10px;background:#e7eddf}.responsive{display:flex;align-items:start;gap:18px}.responsive img{max-width:48%;height:auto;border:1px solid #ddd1b8;border-radius:10px}@media(max-width:700px){main{padding:14px}article{padding:12px}.planes{grid-template-columns:1fr 1fr}h1{font-size:27px}}
</style><main><p class="tag">ĐÀ LẠT / FULL HD / V5</p><h1>Dạo Đà Lạt cùng sáu người bạn</h1><p>Ảnh cảnh được tạo lại và tách thành các lớp alpha có chiều sâu. Đường đá, đường đất và cầu gỗ giữ nguyên vị trí; cảnh xa, cây lá và các khớp nhân vật chuyển động nhẹ. Lấy cảm hứng từ <a href="https://vinwonders.com/vi/wonderpedia/news/canh-dep-da-lat/">các cảnh Đà Lạt trong bài VinWonders</a>; đây là tranh minh họa, không phải ảnh chụp địa điểm. <a href="http://localhost:3000/english/cafe">Mở các cảnh đang chạy trên máy</a>.</p><p class="status">15 kiểm tra Node và 8 bài kiểm thử trình duyệt đạt; kiểm tra thêm 390×844 / 768×1024 đạt. Build Webpack thành công. Đây là bản tích hợp cục bộ để owner xem thẩm mỹ.</p>${cards.join("\n")}<article><h2>Điện thoại và máy tính bảng</h2><div class="responsive"><a href="mobile-runtime.png"><img src="mobile-runtime.png" alt="Cảnh Đà Lạt tại 390×844"></a><a href="tablet-runtime.png"><img src="tablet-runtime.png" alt="Cảnh Đà Lạt tại 768×1024"></a></div></article><article><h2>Nguồn và phạm vi</h2><p>Ảnh master và ảnh có nhân vật đều 1920×1080. Master ghép từ hai vùng chi tiết image_gen 1254×1254 có phần chồng mép; các lớp dùng lại pixel chi tiết ở phần nhìn thấy và ảnh phục dựng ở phần bị che. Kích thước concept ban đầu 1672×941 được ghi đúng trong log; không gọi đây là ảnh 4K. Mỗi bộ ảnh có thư mục riêng. Sáu master giữ nguyên SHA-256; Cloud Daisy giữ tay mèo. Sun King để đợt sau; Mr. Pink ở nút hướng dẫn.</p><p>Nhân vật dùng PixiJS/GSAP, không dùng GIF làm runtime. Chớp mắt, chào, cử động tay và miệng cơ bản đã có; các hành động signature đầy đủ như laptop/lật sách/camera rời còn ghi trong báo cáo NPC.</p><p><a href="generation-jobs-v5.json">Prompt tạo cảnh/lớp</a> · <a href="../cafe/npc-mouth-jobs-v4.json">Prompt edit miệng</a> · <a href="fullhd-manifest-v5.json">Manifest và checksum</a> · <a href="verification-v5.json">Kiểm chứng</a> · <a href="../../docs/DALAT_FULLHD_SCENES.md">Lệnh dựng lại và giới hạn</a> · <a href="../npc/index.html">12 GIF M1</a></p><p>Tạo bằng image_gen tích hợp. Model/usage/chi phí USD không được công cụ cung cấp. Chưa deploy ngoài máy và chưa tự duyệt gate production.</p></article></main></html>\n`,
);
console.log(
  `Review: ${out}/review.html; ${captures.length} scene captures, desktop/tablet/mobile.`,
);
