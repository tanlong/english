import { readFile, writeFile } from "node:fs/promises";
import { roleCharacters } from "../../app/cafe/role-npcs.ts";

const root = "art/dalat/role-expansion-v1";
const sceneIds = [
  "coffee_house",
  "hobby_library",
  "it_team_room",
  "banking_office",
  "development_lab",
  "qa_operations",
];
const metadata = await Promise.all(
  [...sceneIds, ...roleCharacters.map((npc) => npc[2])].map(async (id) =>
    JSON.parse(await readFile(`${root}/${id}.json`, "utf8")),
  ),
);
const assets = Object.fromEntries(
  metadata
    .filter((asset) => asset.kind === "npc")
    .map((asset) => [
      asset.id,
      {
        src: asset.src,
        width: asset.width,
        height: asset.height,
        source: asset.source,
      },
    ]),
);
await writeFile("app/cafe/role-npc-assets.json", JSON.stringify(assets, null, 2) + "\n");
await writeFile(
  `${root}/manifest.json`,
  JSON.stringify({ generator: "built-in image_gen", assets: metadata }, null, 2) + "\n",
);
console.log(
  `Registered ${Object.keys(assets).length} NPC portraits and ${sceneIds.length} scene backgrounds.`,
);
