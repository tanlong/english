// Original code-drawn artwork. Run with `node scripts/build-cafe-art.mjs`.
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = "public/cafe/assets";
await mkdir(root, { recursive: true });
await mkdir("artifacts/cafe", { recursive: true });
const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1200 675">${body}</svg>`;
const sky = `<defs><linearGradient id="sky" x2="0" y2="1" color-interpolation="linearRGB"><stop stop-color="#add8d9"/><stop offset=".4" stop-color="#c5e1dc"/><stop offset=".75" stop-color="#e4e9cf"/><stop offset="1" stop-color="#f5ebcf"/></linearGradient></defs><path fill="url(#sky)" d="M0 0h1200v675H0z"/><circle cx="910" cy="130" r="55" fill="#fff7d5" opacity=".85"/><g fill="#f7f6e9" opacity=".7"><ellipse cx="240" cy="124" rx="120" ry="20"/><ellipse cx="295" cy="107" rx="64" ry="30"/><ellipse cx="1035" cy="230" rx="150" ry="17"/></g>`;
const mountains = `<path fill="#b1c5b7" d="M-40 380Q100 150 320 320Q480 120 685 285Q900 118 1240 355V675H-40Z"/><path fill="#8eafa4" d="M-40 430Q160 300 350 395Q580 235 780 365Q1000 260 1240 420V675H-40Z"/><path fill="#75978a" d="M-20 490Q190 355 405 450Q630 330 840 440Q1065 344 1220 485V675H-20Z"/><path fill="#d6ded0" opacity=".7" d="M-30 425Q250 382 500 435T1240 420V449Q950 448 720 455T-30 470Z"/><path fill="#b6cbbb" opacity=".8" d="M0 512Q350 445 590 493T1200 490V530H0Z"/>`;
const pine = (x, y, scale = 1, color = "#527b68") =>
  `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 0V210" stroke="#79684e" stroke-width="12" stroke-linecap="round"/><path d="M0-30-42 58H-26L-57 116H-35L-74 175H74L35 116H57L26 58H42Z" fill="${color}"/><path d="M0 6-23 63H-10L-33 118H-13L-44 162H-8V8" fill="#8daa7b" opacity=".3"/></g>`;
const pines =
  pine(90, 290, 0.88, "#658e77") +
  pine(1145, 290, 1.04, "#668b72") +
  pine(1030, 325, 0.7, "#789d7f");
const flower = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 50V-4M0 32Q-30 8-34 22Q-24 40 0 40M0 25Q22 0 30 12Q23 30 0 32" fill="#6d986c" stroke="#638665" stroke-width="3"/><g fill="#b6b0d3"><circle cx="-13" cy="-4" r="17"/><circle cx="12" cy="-10" r="18"/><circle cx="0" cy="-25" r="15"/><circle cx="0" cy="4" r="17"/></g><g fill="#d2cbe5"><circle cx="-12" cy="-11" r="5"/><circle cx="10" cy="-18" r="5"/><circle cx="1" cy="7" r="5"/><circle cx="17" cy="0" r="5"/></g></g>`;
const pot = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-35 0h70l-8 48h-54z" fill="#b67557"/><path d="M-40-6h80v14h-80z" rx="6" fill="#ce8f66"/><path d="M0-5Q-55-62-18-74Q6-58 0-5M0-6Q48-80 63-58Q61-26 0-6M0-7Q-5-103 17-105Q46-80 0-7" fill="#729764"/><path d="M0-7 8-67" stroke="#a0b779" stroke-width="4"/></g>`;
const table = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cy="125" rx="100" ry="17" fill="#596f61" opacity=".13"/><path d="M-57 9-73 118M56 9 72 118" stroke="#745a45" stroke-width="15" stroke-linecap="round"/><ellipse cy="12" rx="106" ry="34" fill="#977052"/><ellipse cy="0" rx="107" ry="33" fill="#d5ab77"/><ellipse cy="-4" rx="96" ry="25" fill="#dfbc89"/><path d="M-50-18v-15h26v15q-13 15-26 0" fill="#fcf4df"/><path d="M-24-31q19 1 9 13h-9" fill="none" stroke="#fcf4df" stroke-width="5"/><ellipse cx="-37" cy="-33" rx="13" ry="4" fill="#8a6144"/></g>`;
const inside = `<path fill="#f2e4cc" fill-rule="evenodd" d="M0 0h1200v440H0ZM414 420V178a155 155 0 0 1 310 0v242ZM800 420V178a155 155 0 0 1 310 0v242Z"/><path d="M0 420h1200v255H0z" fill="#d9b98c"/><path d="M0 440h1200M0 492h1200M0 554h1200M0 627h1200M80 420-120 675M270 420 170 675M470 420 460 675M665 420 760 675M865 420 1050 675M1065 420 1340 675" stroke="#c2a17b" stroke-width="2"/><g fill="none" stroke="#b99a74" stroke-width="17"><path d="M414 420V178a155 155 0 0 1 310 0v242M800 420V178a155 155 0 0 1 310 0v242"/></g><g stroke="#e9d2aa" stroke-width="8"><path d="M568 48v376M414 230h310M955 48v376M800 230h310"/></g><path d="M0 20h1200v26H0zM0 421h1200v18H0z" fill="#b6946d"/><rect x="44" y="143" width="292" height="13" rx="5" fill="#987350"/><rect x="44" y="247" width="292" height="13" rx="5" fill="#987350"/><g fill="#c88e6e"><rect x="65" y="102" width="27" height="40" rx="5"/><rect x="122" y="108" width="30" height="34" rx="5"/><rect x="180" y="97" width="29" height="45" rx="5"/></g><g fill="#88a194"><rect x="64" y="205" width="39" height="41" rx="7"/><rect x="130" y="209" width="39" height="37" rx="7"/><rect x="196" y="204" width="39" height="42" rx="7"/></g><rect x="50" y="310" width="143" height="101" rx="13" fill="#4e6d66"/><rect x="61" y="320" width="119" height="39" rx="6" fill="#91aca0"/><path d="M76 365v27M139 365v27" stroke="#ded0aa" stroke-width="8"/><rect x="41" y="407" width="176" height="15" rx="5" fill="#755e4c"/><path d="M573 456v82M638 456v82M911 470v77M979 470v77" stroke="#9b7857" stroke-width="11"/><rect x="562" y="414" width="90" height="67" rx="15" fill="#ca9f70"/><rect x="900" y="428" width="90" height="67" rx="15" fill="#ca9f70"/>`;
const counter = `<path d="M66 433h310v114q-140 21-310 0z" fill="#9f7353"/><path d="M82 449h276v81H82z" fill="#bc9167"/><path d="M128 451v78M201 451v78M274 451v78" stroke="#a37b58" stroke-width="4"/><path d="M49 424q159-15 343 0v22q-170 18-343 0z" fill="#6e5546"/><path d="M55 418q161-13 332 0l5 9q-170 15-343 0z" fill="#ddba86"/>${table(622, 481, 0.75)}${table(943, 497, 0.75)}${pot(1148, 519, 1.06)}`;
const outdoor = `<path d="M0 430Q500 400 1200 431V675H0Z" fill="#d7c5a0"/><path d="M0 480h1200M0 550h1200M0 630h1200M150 430 15 675M350 430 315 675M550 430 615 675M750 430 915 675M950 430 1215 675" stroke="#c7b58e" stroke-width="3"/><path d="M8 180v360M186 180v288" stroke="#a77c57" stroke-width="24"/><path d="M-30 30H278l-67 173H-30Z" fill="#786c57"/><path d="M-30 43H264l-20 50H-30Z" fill="#8f8768"/><path d="M-20 195H211" stroke="#b78c60" stroke-width="16"/><path d="M212 384h988M212 451h988" stroke="#af906a" stroke-width="14"/><g stroke="#b99c74" stroke-width="10"><path d="M240 388v69M335 388v69M430 388v69M525 388v69M620 388v69M715 388v69M810 388v69M905 388v69M1000 388v69M1095 388v69M1190 388v69"/></g><path d="M375 475v80M430 475v80M840 480v80M905 480v80" stroke="#907255" stroke-width="10"/><rect x="361" y="420" width="85" height="71" rx="15" fill="#bb966a"/><rect x="827" y="426" width="91" height="72" rx="15" fill="#bb966a"/>`;
const mountain = `<path d="M0 493Q600 460 1200 500V675H0Z" fill="#c8c2a3"/><path d="M0 595Q600 515 1200 577v98H0Z" fill="#ded0ac"/><path d="M0 425Q620 394 1200 435M0 493Q620 460 1200 505" fill="none" stroke="#a38b64" stroke-width="17"/><g fill="none" stroke="#b39b72" stroke-width="11"><path d="M70 423v76M210 419v77M350 415v77M490 412v78M630 413v77M770 417v80M910 425v80M1050 429v80M1190 435v80"/></g><path d="M335 502v100M535 502v100" stroke="#7a6750" stroke-width="13"/><rect x="308" y="482" width="256" height="35" rx="9" fill="#b39065"/><rect x="317" y="440" width="237" height="29" rx="8" fill="#c5a67b"/>`;
const sceneData = [
  {
    id: "inside_cafe",
    architecture: inside,
    foreground: counter,
    foliage: `${pot(300, 206, 0.7)}<g stroke="#675d4b" stroke-width="4"><path d="M476 0v87M861 0v65"/></g><g fill="#d9ac69"><path d="M441 115q35-65 70 0z"/><path d="M826 93q35-65 70 0z"/></g><g fill="#ffedba" opacity=".2"><path d="m441 115-80 260h230l-80-260z"/><path d="m826 93-80 290h230l-80-290z"/></g>`,
  },
  {
    id: "outdoor_terrace",
    architecture: outdoor,
    foreground: `${table(390, 507, 0.82)}${table(857, 514, 0.82)}${pot(107, 555, 1.2)}${flower(1108, 555, 1.4)}${flower(1175, 574, 1.7)}`,
    foliage: `${pines}<path d="M210 115Q550 175 1090 95" fill="none" stroke="#8c8c64" stroke-width="3"/><g fill="#fff1c3"><circle cx="330" cy="132" r="9"/><circle cx="480" cy="144" r="9"/><circle cx="630" cy="141" r="9"/><circle cx="780" cy="128" r="9"/><circle cx="930" cy="115" r="9"/></g>`,
  },
  {
    id: "mountain_view",
    architecture: mountain,
    foreground: `${flower(80, 587, 1.6)}${flower(145, 612, 1.8)}${flower(212, 628, 1.4)}${flower(1132, 610, 1.8)}<path d="M0 650Q140 615 290 675H0M1050 675q100-60 150-35v35" fill="#7f9468"/>`,
    foliage: pine(70, 242, 1.9, "#50785f") + pine(1190, 190, 2.3, "#557c62"),
  },
];
const manifest = {
  assetRevision: "cafe-vector-v1",
  updatedAt: "2026-11-04",
  owner: "Natural English project",
  license: "Original code-drawn artwork; project-owned",
  status: "draft-awaiting-art-review",
  logicalSize: { width: 1920, height: 1080 },
  assets: [],
};
for (const scene of sceneData) {
  for (const [name, content] of Object.entries({
    sky,
    mountains,
    architecture: scene.architecture,
    foliage: scene.foliage,
    foreground: scene.foreground,
  })) {
    const data = svg(content);
    const checksum = createHash("sha256").update(data).digest("hex");
    const filename = `${scene.id}-${name}-${checksum.slice(0, 10)}.svg`;
    await writeFile(`${root}/${filename}`, data);
    manifest.assets.push({
      scene: scene.id,
      layer: name,
      src: `/cafe/assets/${filename}`,
      checksum,
      bytes: Buffer.byteLength(data),
    });
  }
  await writeFile(
    `artifacts/cafe/${scene.id}.svg`,
    svg(sky + mountains + scene.architecture + scene.foliage + scene.foreground),
  );
}
await writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
const scenes = [
  {
    id: "inside_cafe",
    label: "Trong quán",
    subtitle: "Cà phê ấm, câu chuyện gần",
    npcs: [
      { id: "may", x: 21, y: 76, width: 15 },
      { id: "ollie_owl", x: 52, y: 79, width: 15 },
      { id: "mimi_bunny", x: 78.5, y: 81, width: 14 },
    ],
    exits: [{ to: "outdoor_terrace", direction: "right", label: "Ra sân ngoài trời" }],
  },
  {
    id: "outdoor_terrace",
    label: "Sân ngoài trời",
    subtitle: "Chút nắng, chút gió Đà Lạt",
    npcs: [
      { id: "astro_bean", x: 32.5, y: 81, width: 15 },
      { id: "deo_explorer", x: 71.4, y: 82, width: 15 },
    ],
    exits: [
      { to: "inside_cafe", direction: "left", label: "Vào trong quán" },
      { to: "mountain_view", direction: "right", label: "Đến view đèo" },
    ],
  },
  {
    id: "mountain_view",
    label: "View đèo",
    subtitle: "Chậm lại một nhịp giữa thung lũng",
    npcs: [{ id: "gray_boo", x: 64, y: 87, width: 16 }],
    exits: [{ to: "outdoor_terrace", direction: "left", label: "Về sân ngoài trời" }],
  },
].map((scene) => ({
  ...scene,
  layers: manifest.assets
    .filter((a) => a.scene === scene.id)
    .map(({ layer, src }) => ({
      id: layer,
      src,
      depth: layer === "mountains" ? 0.4 : layer === "sky" ? 0.1 : 0,
      zIndex: layer === "foreground" ? 40 : layer === "foliage" ? 20 : 10,
    })),
}));
await mkdir("configs", { recursive: true });
await writeFile(
  "configs/scenes.json",
  JSON.stringify(
    {
      version: "1.3",
      assetRevision: manifest.assetRevision,
      artStatus: manifest.status,
      logicalSize: manifest.logicalSize,
      defaultSceneId: "inside_cafe",
      scenes,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Generated ${manifest.assets.length} clean depth layers (${manifest.assets.reduce((s, a) => s + a.bytes, 0)} bytes total).`,
);
