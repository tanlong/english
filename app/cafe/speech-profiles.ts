import type { NpcId } from "./content.ts";
import { roleNpcs } from "./role-npcs.ts";

const baseProfiles = {
  cloud_daisy: { voice: "Sulafat", style: "warm, welcoming and patient" },
  ollie_owl: { voice: "Gacrux", style: "mature, calm and thoughtful" },
  mimi_bunny: { voice: "Leda", style: "bright, gentle and cheerful" },
  astro_bean: { voice: "Puck", style: "upbeat, curious and adventurous" },
  bear_explorer: { voice: "Orus", style: "grounded, reassuring and friendly" },
  gray_boo: { voice: "Callirrhoe", style: "softly playful, gentle and curious" },
  mr_pink: { voice: "Achird", style: "friendly, clear and encouraging" },
  nina_cat: { voice: "Aoede", style: "breezy, welcoming and conversational" },
  ben_bear: { voice: "Algenib", style: "warm, grounded and relaxed" },
  luna_deer: { voice: "Achernar", style: "soft, patient and helpful" },
  penny_panda: { voice: "Kore", style: "confident, approachable and practical" },
  rio_fox: { voice: "Algieba", style: "smooth, friendly and curious" },
  toby_corgi: { voice: "Fenrir", style: "lively, welcoming and upbeat" },
  alex_otter: { voice: "Iapetus", style: "clear, collaborative and encouraging" },
  morgan_wolf: { voice: "Charon", style: "calm, informative and thoughtful" },
  bailey_beaver: { voice: "Rasalgethi", style: "practical, patient and informative" },
  ivy_cat: { voice: "Erinome", style: "clear, attentive and creative" },
  dex_robot: {
    voice: "Alnilam",
    style: "precise, helpful and conversational, without robotic effects",
  },
  tess_turtle: { voice: "Vindemiatrix", style: "gentle, supportive and patient" },
  sun_king: { voice: "Sadachbia", style: "lively, optimistic and lightly amused" },
};

export const npcSpeechProfiles: Record<string, { voice: string; style: string }> = {
  ...baseProfiles,
  ...Object.fromEntries(
    roleNpcs.map((npc, index) => [
      npc.id,
      {
        voice: Object.values(baseProfiles)[index % Object.keys(baseProfiles).length].voice,
        style:
          npc.role === "guide"
            ? "patient, clear and encouraging, like a friendly teacher"
            : "warm, conversational and supportive",
      },
    ]),
  ),
};

export function npcSpeechStyle(npcId: NpcId) {
  return `Clear American English, ${npcSpeechProfiles[npcId].style}. Natural conversational intonation and pace, suitable for an adult English learner. Keep the same voice identity. No exaggerated cartoon effects. Read only the supplied words.`;
}
