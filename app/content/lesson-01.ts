import { naturalPhrasePattern, naturalPhraseTranslations } from "../natural-phrases.ts";
import {
  editorialSources,
  flashcards,
  patterns,
  qa,
  sentences as sourceSentences,
  story,
  upgradeExamples,
  verifiedNaturalPhrases,
} from "./lesson-01-source.ts";
import type { Chunk, Hotspot, Lesson, Scene, Sentence } from "./types.ts";

const lessonId = "lesson-01";
const audioVersion = "lesson-01-audio-v2";

const spokenTextOverrides: Record<number, string> = {
  1: "I usually get up around five forty A.M.",
  4: "Around six o'clock, I wake up my six-year-old son.",
  12: "I normally arrive at the office around seven o'clock or seven ten.",
  13: "I park my motorcycle on level B three.",
  17: "I can relax for a bit before work starts at seven forty-five.",
  18: "I work as a B A.",
  19: "Most of my job involves business analysis and U I, U X design.",
  25: "I'm back at my desk by one P.M.",
  26: "I work until five thirty.",
};

function sentenceId(index: number) {
  return `${lessonId}-sentence-${String(index + 1).padStart(2, "0")}`;
}

function createChunks(text: string, parentId: string): Chunk[] {
  const phrasePattern = new RegExp(naturalPhrasePattern.source, "gi");

  return [...text.matchAll(phrasePattern)].map((match, index) => ({
    id: `${parentId}-chunk-${String(index + 1).padStart(2, "0")}`,
    text: match[0],
    meaning: naturalPhraseTranslations[match[0].toLocaleLowerCase("en-US")],
  }));
}

const sentences: readonly Sentence[] = sourceSentences.map((source, index) => {
  const id = sentenceId(index);

  return {
    id,
    ...source,
    chunks: createChunks(source.en, id),
    audio: {
      id: `${id}-audio-v2`,
      version: audioVersion,
      locale: "en-US",
      provider: "openai",
      model: "gpt-4o-mini-tts",
      voice: "nova",
      spokenText: spokenTextOverrides[index + 1] ?? source.en,
    },
  };
});

function sentenceIds(from: number, to: number) {
  return sentences.slice(from - 1, to).map((sentence) => sentence.id);
}

function createHotspot(
  scene: string,
  order: number,
  label: string,
  ipa: string,
  meaning: string,
  sentenceNumber: number,
  xPercent: number,
  yPercent: number,
): Hotspot {
  const id = `${lessonId}-scene-${scene}-hotspot-${String(order).padStart(2, "0")}`;
  return {
    id,
    label,
    ipa,
    meaning,
    sentenceId: sentenceId(sentenceNumber - 1),
    position: { xPercent, yPercent },
    audio: {
      id: `${id}-audio-v2`,
      version: audioVersion,
      locale: "en-US",
      provider: "openai",
      model: "gpt-4o-mini-tts",
      voice: "nova",
      spokenText: label,
    },
  };
}

const scenes: readonly Scene[] = [
  {
    id: `${lessonId}-scene-wake-up`,
    title: "Wake up",
    imageAssetId: "flashcard-wake-up-16x9",
    imageVersion: "lesson-01-images-v1",
    sentenceIds: sentenceIds(1, 7),
    hotspots: [
      createHotspot("wake-up", 1, "alarm clock", "/əˈlɑːrm klɑːk/", "đồng hồ báo thức", 1, 18, 72),
      createHotspot("wake-up", 2, "bed", "/bed/", "giường", 1, 66, 80),
      createHotspot("wake-up", 3, "window", "/ˈwɪndoʊ/", "cửa sổ", 1, 82, 30),
      createHotspot("wake-up", 4, "plant", "/plænt/", "cây cảnh", 2, 7, 52),
    ],
  },
  {
    id: `${lessonId}-scene-go-to-school`,
    title: "Go to school",
    imageAssetId: "flashcard-school-drop-off-16x9",
    imageVersion: "lesson-01-images-v1",
    sentenceIds: sentenceIds(8, 10),
    hotspots: [
      createHotspot("go-to-school", 1, "school bag", "/skuːl bæɡ/", "cặp đi học", 6, 74, 62),
      createHotspot("go-to-school", 2, "school", "/skuːl/", "trường học", 9, 68, 31),
      createHotspot("go-to-school", 3, "school gate", "/skuːl ɡeɪt/", "cổng trường", 9, 52, 48),
      createHotspot("go-to-school", 4, "car", "/kɑːr/", "ô tô", 8, 8, 72),
    ],
  },
  {
    id: `${lessonId}-scene-get-breakfast`,
    title: "Get breakfast",
    imageAssetId: "flashcard-breakfast-16x9",
    imageVersion: "lesson-01-images-v1",
    sentenceIds: sentenceIds(11, 12),
    hotspots: [
      createHotspot(
        "get-breakfast",
        1,
        "breakfast sandwich",
        "/ˈbrekfəst ˈsænwɪtʃ/",
        "bánh mì ăn sáng",
        11,
        60,
        40,
      ),
      createHotspot("get-breakfast", 2, "food cart", "/fuːd kɑːrt/", "xe bán đồ ăn", 11, 75, 68),
      createHotspot(
        "get-breakfast",
        3,
        "motorcycle helmet",
        "/ˈmoʊtərsaɪkəl ˈhelmət/",
        "mũ bảo hiểm xe máy",
        8,
        20,
        65,
      ),
      createHotspot("get-breakfast", 4, "vendor", "/ˈvendər/", "người bán hàng", 11, 82, 30),
    ],
  },
  {
    id: `${lessonId}-scene-clock-in`,
    title: "Clock in",
    imageAssetId: "flashcard-clock-in-16x9",
    imageVersion: "lesson-01-images-v1",
    sentenceIds: sentenceIds(13, 17),
    hotspots: [
      createHotspot("clock-in", 1, "ID badge", "/ˌaɪ ˈdiː bædʒ/", "thẻ nhân viên", 14, 71, 54),
      createHotspot("clock-in", 2, "card reader", "/kɑːrd ˈriːdər/", "máy đọc thẻ", 14, 78, 48),
      createHotspot("clock-in", 3, "office", "/ˈɔːfɪs/", "văn phòng", 12, 88, 43),
    ],
  },
  {
    id: `${lessonId}-scene-at-work`,
    title: "At work",
    imageAssetId: "flashcard-work-as-ba-16x9",
    imageVersion: "lesson-01-images-v1",
    sentenceIds: sentenceIds(18, 25),
    hotspots: [
      createHotspot("at-work", 1, "laptop", "/ˈlæptɑːp/", "máy tính xách tay", 20, 57, 69),
      createHotspot("at-work", 2, "monitor", "/ˈmɑːnɪtər/", "màn hình", 20, 86, 39),
      createHotspot("at-work", 3, "coffee", "/ˈkɔːfi/", "cà phê", 15, 16, 80),
      createHotspot("at-work", 4, "notebook", "/ˈnoʊtbʊk/", "sổ tay", 20, 39, 84),
    ],
  },
  {
    id: `${lessonId}-scene-head-home`,
    title: "Head home",
    imageAssetId: "flashcard-head-home-16x9",
    imageVersion: "lesson-01-images-v1",
    sentenceIds: sentenceIds(26, 28),
    hotspots: [
      createHotspot("head-home", 1, "helmet", "/ˈhelmət/", "mũ bảo hiểm", 27, 39, 16),
      createHotspot("head-home", 2, "motorcycle", "/ˈmoʊtərsaɪkəl/", "xe máy", 27, 61, 79),
      createHotspot("head-home", 3, "backpack", "/ˈbækpæk/", "ba lô", 27, 29, 55),
    ],
  },
];

export const lesson01 = {
  id: lessonId,
  slug: "my-daily-routine",
  number: "01",
  title: "My Daily Routine",
  description: "Kể về một ngày điển hình",
  locale: "en-US",
  contentVersion: "lesson-01-content-v1",
  audioVersion,
  sentences,
  scenes,
  prompts: qa.map(([instruction, answer], index) => ({
    id: `${lessonId}-prompt-${String(index + 1).padStart(2, "0")}`,
    kind: "speaking" as const,
    instruction,
    answer,
    sentenceIds: [],
  })),
  practice: {
    flashcards,
    qa,
    patterns,
    upgrades: upgradeExamples,
  },
  story,
  sources: editorialSources,
} satisfies Lesson;

export { verifiedNaturalPhrases };
