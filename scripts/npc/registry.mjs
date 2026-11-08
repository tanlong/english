export const npcs = [
  {
    id: "cloud_daisy",
    name: "Cloud Cat",
    alias: "may",
    species: "white cat with cat paws (owner override 2026-11-05)",
    idle: 8,
    interaction: 2,
    parts: ["body", "arm_wave", "arm_hold", "eyes_closed"],
    props: ["cup", "cloth"],
  },
  {
    id: "ollie_owl",
    name: "Ollie Owl",
    species: "owl",
    idle: 8,
    interaction: 2,
    parts: ["torso", "head", "wing_l", "wing_r", "glasses", "eyelid", "beak_open"],
    props: ["laptop", "coffee_cup"],
  },
  {
    id: "mimi_bunny",
    name: "Mimi Bunny",
    species: "rabbit",
    idle: 7,
    interaction: 2,
    parts: ["torso", "head", "ear_l", "ear_r", "arm_l", "arm_r", "blink", "smiling_mouth"],
    props: ["book_closed", "book_open", "page_turn"],
  },
  {
    id: "astro_bean",
    name: "Astro Bean",
    species: "orange bean astronaut exactly as owner-approved source; no bird wings or beak",
    idle: 8,
    interaction: 2,
    parts: ["suit", "head", "arm_l", "arm_r", "boots", "visor", "blink"],
    props: ["handheld_viewer"],
  },
  {
    id: "bear_explorer",
    name: "Bear Explorer",
    alias: "deo_explorer",
    species: "bear",
    idle: 9,
    interaction: 2.5,
    parts: [
      "torso",
      "bear_head",
      "ears",
      "arm_l",
      "arm_r",
      "legs",
      "backpack",
      "blink",
      "mouth_open",
    ],
    props: ["map_closed", "map_open", "camera"],
  },
  {
    id: "gray_boo",
    name: "Gray Boo",
    species: "alien",
    idle: 9,
    interaction: 2.5,
    parts: ["hoodie", "head", "arm_l", "arm_r", "legs", "eyes_closed", "mouth_open"],
    props: ["earth_guide", "cup"],
  },
];

export function resolveNpc(id) {
  const npc = npcs.find((entry) => entry.id === id || entry.alias === id);
  if (!npc) throw new Error(`Unknown NPC: ${id}`);
  return npc;
}
