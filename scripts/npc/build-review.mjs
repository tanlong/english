import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { npcs, resolveNpc } from "./registry.mjs";

const root = process.cwd();
const npcIndex = process.argv.indexOf("--npc");
const npc = resolveNpc(npcIndex < 0 ? "cloud_daisy" : process.argv[npcIndex + 1]);
const base = path.join(root, "art/npc", npc.id);
const out = path.join(root, "reports/npc", npc.id);
await mkdir(out, { recursive: true });
const rigBytes = await readFile(path.join(base, "rig.json"));
const rig = JSON.parse(rigBytes);
if (rig.npcId !== npc.id) throw new Error("Rig NPC does not match the requested character.");
const masterBytes = await readFile(path.join(base, "source/master_rgba.png"));
const masterSize = await sharp(masterBytes).metadata();
if (
  rig.coordinateSystem.width !== masterSize.width ||
  rig.coordinateSystem.height !== masterSize.height
)
  throw new Error("Rig coordinates must match the source master pixel dimensions.");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const uri = async (file) => `data:image/png;base64,${(await readFile(file)).toString("base64")}`;
const sources = {};
const layerHashes = [];
for (const layer of rig.layers) {
  const file = path.join(base, layer.file);
  sources[layer.id] = await uri(file);
  layerHashes.push({ file: layer.file, sha256: hash(await readFile(file)) });
}
const master = `data:image/png;base64,${masterBytes.toString("base64")}`;
const rendererBytes = await readFile(path.join(root, "scripts/npc/review-player.mjs"));
const player = rendererBytes.toString("utf8").replace("export async function", "async function");
const buildMeta = {
  rigHash: hash(rigBytes),
  masterHash: hash(masterBytes),
  rendererHash: hash(rendererBytes),
  layers: layerHashes,
};
const placementIds = Object.keys(rig.placement).filter(
  (id) =>
    id !== "body" && Number.isFinite(rig.placement[id].x) && Number.isFinite(rig.placement[id].y),
);
const layerOptions = placementIds.map((id) => `<option>${id}</option>`).join("");
const limitations = (rig.limitations ?? []).join(" · ");
const approval = JSON.parse(await readFile(path.join(base, "approval.json"), "utf8"));
const approvedPilot = approval.pilot?.accepted
  ? "Mẫu chuyển động đã duyệt; lớp art mới và production cần duyệt riêng."
  : "Lớp art và hai clip mới chưa duyệt.";
const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${npc.name} · Art Review</title>
<style>
:root{color-scheme:dark;--bg:#0b1220;--panel:#162034;--ink:#f1f5f9;--muted:#b1bfd2;--line:#475569;--accent:#99e0ba}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif}main{max-width:1240px;margin:auto;padding:28px}h1{font-size:28px;letter-spacing:-.04em;margin:6px 0}p{color:var(--muted);margin:8px 0 20px}.tag{font:12px ui-monospace,monospace;letter-spacing:.1em;color:var(--accent)}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}article,aside{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:18px}h2{font-size:15px;font-weight:600;margin:0 0 12px}.stage{height:610px;display:flex;align-items:center;justify-content:center;background-color:#e9e7df;border-radius:8px;overflow:hidden}.stage img{max-width:100%;max-height:95%;object-fit:contain}.stage canvas{height:100%;max-width:100%;object-fit:contain;touch-action:none}button,select,input[type=number]{font:inherit;color:var(--ink);background:#25334b;border:1px solid var(--line);border-radius:7px;min-height:44px;padding:8px 12px}button,select{cursor:pointer}button:hover{border-color:var(--accent)}:focus-visible{outline:3px solid var(--accent);outline-offset:3px}.controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:16px 0}label{display:flex;gap:8px;align-items:center;min-height:44px}input[type=range]{accent-color:var(--accent);height:44px;flex:1;min-width:140px}aside{margin-top:18px}summary{cursor:pointer;min-height:44px}small{color:var(--muted)}.fields{display:flex;gap:12px;flex-wrap:wrap}.fields input{width:90px}.sizes{display:flex;align-items:end;gap:20px;overflow:auto}.sizes img{max-width:30%;object-fit:contain}output{font:14px ui-monospace,monospace;color:var(--accent)}.note{border-left:3px solid #e8c17b;padding-left:12px}.files a{color:var(--accent)}@media(max-width:700px){main{padding:14px}.grid{grid-template-columns:1fr}.stage{height:470px}.fields label{font-size:14px}}
</style><main><span class="tag">NPC PIPELINE / ${npc.id.toUpperCase()} / DRAFT</span><h1>${npc.name} — kiểm tra art & chuyển động</h1><p>Master đã duyệt. ${approvedPilot} Không có thay đổi vào app production.</p>
<div class="grid"><article><h2>Master gốc đã khóa SHA-256</h2><div class="stage" id="masterStage"><canvas id="masterCanvas" width="512" height="640" role="img" aria-label="${npc.name}, master nguồn đã duyệt, cùng tỷ lệ hiển thị với rig"></canvas></div></article><article><h2>Rig nháp — ${rig.layers.length} lớp có tọa độ riêng</h2><div class="stage" id="rigStage"><canvas id="canvas" width="512" height="640" role="img" aria-label="Rig ${npc.name}; các điều khiển dưới đây cho phép tua và chỉnh điểm xoay"></canvas></div></article></div>
<div class="controls"><label>Clip <select id="clip"><option value="idle">Idle · ${rig.clips.idle.duration} giây · loop</option><option value="interaction">Interaction · ${rig.clips.interaction.duration} giây · one-shot</option><option value="listening">Listening · hold</option></select></label><button id="play" type="button">Phát</button><button id="notice" type="button">Chào một lần</button><button id="reset" type="button">Về đầu</button><label><input id="debug" type="checkbox">Điểm xoay</label><label>Nền <select id="bg"><option value="#e9e7df">Sáng</option><option value="#101827">Tối</option><option value="#86a68e">Xanh café</option><option value="transparent">Trong suốt</option></select></label></div>
<div class="controls"><label for="scrub">Timeline</label><input id="scrub" type="range" min="0" max="${rig.clips.idle.duration}" step="0.001" value="0"><output id="clock">0.000 / ${rig.clips.idle.duration.toFixed(3)} s</output></div>
<aside><details><summary>Hiệu chỉnh khớp / vị trí layer</summary><p>Kéo điểm vai trên rig khi bật điểm xoay, hoặc nhập tọa độ bên dưới. Tải JSON để lưu bản hiệu chỉnh; không tự động duyệt art.</p><div class="controls"><label>Layer <select id="layer">${layerOptions}</select></label><button id="download">Tải rig JSON</button></div><div class="fields" id="fields"></div></details></aside>
<aside><h2>Độ rõ ở kích thước runtime</h2><div class="sizes"><img id="size150" height="150" alt="Rig cao 150 pixel"><img id="size220" height="220" alt="Rig cao 220 pixel"><img id="size260" height="260" alt="Rig cao 260 pixel"></div></aside>
<aside class="note"><h2>Cần duyệt</h2><p>Khớp vai, nét vẽ và tiếp xúc đạo cụ. ${limitations} Hero được bỏ qua vì không cần cho rig. Preview dùng Canvas2D ngoại tuyến; app hiện dùng DOM/CSS. PixiJS, GSAP và FFmpeg đã được cài để dùng về sau; GIF nháp hiện được mã hóa bằng Sharp/libvips.</p><small>Reduced motion: không tự phát. Tab ẩn: tạm dừng. Dữ liệu ảnh nằm trong file, không gọi API.</small></aside>
</main><script type="module">
${player}
const rig=${JSON.stringify(rig)};
const sources=${JSON.stringify(sources)};
const buildMeta=${JSON.stringify(buildMeta)};
const canvas=document.getElementById('canvas');
const masterImage=new Image();
masterImage.src=${JSON.stringify(master)};
await masterImage.decode();
const masterCanvas=document.getElementById('masterCanvas');
const masterContext=masterCanvas.getContext('2d');
const masterScale=Math.min((masterCanvas.width-48)/rig.coordinateSystem.width,(masterCanvas.height-40)/rig.coordinateSystem.height);
masterContext.translate((masterCanvas.width-rig.coordinateSystem.width*masterScale)/2,(masterCanvas.height-rig.coordinateSystem.height*masterScale)/2);
masterContext.scale(masterScale,masterScale);
masterContext.drawImage(masterImage,0,0);
const player=await createReviewPlayer(canvas,rig,sources);
const byId=(id)=>document.getElementById(id);
let playing=false, time=0, previous=0, frame=0, state='idle';
const duration=()=>rig.clips[state==='interaction'?'interaction':'idle'].duration;
const seek=(t)=>{time=Math.max(0,Math.min(duration(),t));const pose=player.render(time,state);byId('scrub').value=time;byId('clock').textContent=time.toFixed(3)+' / '+duration().toFixed(3)+' s · '+pose.state;return pose;};
const pause=()=>{playing=false;cancelAnimationFrame(frame);frame=0;byId('play').textContent='Phát';};
const tick=(now)=>{if(!playing)return;time+=(now-previous)/1000;previous=now;if(time>=duration()){if(state==='idle')time%=duration();else{time=duration();pause();}}seek(time);if(playing)frame=requestAnimationFrame(tick);};
const play=()=>{pause();if(time>=duration())seek(0);playing=true;previous=performance.now();byId('play').textContent='Dừng';frame=requestAnimationFrame(tick);};
const setClip=(value)=>{pause();state=value;byId('clip').value=value;byId('scrub').max=duration();seek(0);};
byId('play').onclick=()=>playing?pause():play();
byId('notice').onclick=()=>{setClip('interaction');play();};
byId('reset').onclick=()=>{pause();seek(0);};
byId('clip').onchange=(e)=>setClip(e.target.value);
byId('scrub').oninput=(e)=>{pause();seek(Number(e.target.value));};
byId('debug').onchange=(e)=>player.setDebug(e.target.checked);
byId('bg').onchange=(e)=>{byId('masterStage').style.backgroundColor=e.target.value;byId('rigStage').style.backgroundColor=e.target.value;};
const controls=()=>{byId('fields').replaceChildren();const id=byId('layer').value;for(const key of ['x','y','width','height','pivotX','pivotY']){if(!(key in rig.placement[id]))continue;const label=document.createElement('label');label.textContent=key;const input=document.createElement('input');input.type='number';input.step=key.startsWith('pivot')?'0.01':'1';input.value=rig.placement[id][key];input.oninput=()=>{const v=Number(input.value);if(Number.isFinite(v)&&(!['width','height'].includes(key)||v>0)){rig.placement[id][key]=v;seek(time);}};label.append(input);byId('fields').append(label);}};
byId('layer').onchange=controls;controls();
byId('download').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(rig,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=rig.npcId+'-rig-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
let dragging=false;
canvas.onpointerdown=(e)=>{if(!byId('debug').checked)return;pause();dragging=true;canvas.setPointerCapture(e.pointerId);};
canvas.onpointerup=()=>{dragging=false;};
canvas.onpointercancel=()=>{dragging=false;};
canvas.onpointermove=(e)=>{if(!dragging)return;const r=canvas.getBoundingClientRect();const scale=Math.min((canvas.width-48)/rig.coordinateSystem.width,(canvas.height-40)/rig.coordinateSystem.height);const v=rig.placement[byId('layer').value];v.x=((e.clientX-r.left)*canvas.width/r.width-(canvas.width-rig.coordinateSystem.width*scale)/2)/scale;v.y=((e.clientY-r.top)*canvas.height/r.height-(canvas.height-rig.coordinateSystem.height*scale)/2)/scale;controls();seek(time);};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');reduced.addEventListener('change',()=>{if(reduced.matches)pause();});
const poster=canvas.toDataURL('image/png');for(const id of ['size150','size220','size260'])byId(id).src=poster;
window.npcLab={ready:true,seek,setClip,pause,rig,player,buildMeta,get playing(){return playing;}};
seek(0);
</script></html>`;
await writeFile(path.join(out, "review.html"), html);

// Six source candidates in separate folders, plus a single inventory contact sheet.
const cards = [];
for (let i = 0; i < npcs.length; i++) {
  const npc = npcs[i];
  const image = await sharp(path.join(root, "MD", `${npc.name}.png`))
    .resize({
      width: 240,
      height: 300,
      fit: "contain",
      background: "#edf0e8",
      withoutEnlargement: true,
    })
    .flatten({ background: "#edf0e8" })
    .png()
    .toBuffer();
  cards.push({ input: image, left: (i % 3) * 280 + 20, top: Math.floor(i / 3) * 350 + 32 });
  const text = Buffer.from(
    `<svg width="260" height="32"><text x="130" y="23" text-anchor="middle" font-family="sans-serif" font-size="17" fill="#152d24">${npc.name}</text></svg>`,
  );
  cards.push({ input: text, left: (i % 3) * 280 + 10, top: Math.floor(i / 3) * 350 });
}
await sharp({ create: { width: 840, height: 700, channels: 3, background: "#edf0e8" } })
  .composite(cards)
  .png()
  .toFile(path.join(root, "reports/npc/review-contact-sheet.png"));
console.log(`Review ready: ${path.relative(root, path.join(out, "review.html"))}`);
