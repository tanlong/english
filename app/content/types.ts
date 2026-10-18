export type ContentLocale = "en-US";

export type ContentSource = {
  name: string;
  role: string;
  href: string;
};

export type AudioRef = {
  id: string;
  version: string;
  locale: ContentLocale;
  provider: "openai";
  model: "gpt-4o-mini-tts";
  voice: "nova";
  spokenText: string;
};

export type Chunk = {
  id: string;
  text: string;
  meaning: string;
};

export type Sentence = {
  id: string;
  en: string;
  ipa: string;
  vi: string;
  chunks: readonly Chunk[];
  audio: AudioRef;
};

export type Hotspot = {
  id: string;
  label: string;
  ipa: string;
  meaning: string;
  sentenceId: string;
  position: { xPercent: number; yPercent: number };
  audio: AudioRef;
};

export type Scene = {
  id: string;
  title: string;
  imageAssetId: string;
  imageVersion: string;
  sentenceIds: readonly string[];
  hotspots: readonly Hotspot[];
};

export type Prompt = {
  id: string;
  kind: "speaking" | "listening" | "picture-listen-and-find";
  instruction: string;
  answer: string;
  sentenceIds: readonly string[];
};

export type LessonPractice = {
  flashcards: readonly (readonly [vietnamese: string, english: string])[];
  qa: readonly (readonly [question: string, answer: string])[];
  patterns: readonly (readonly [formula: string, example: string])[];
  upgrades: readonly (readonly [basic: string, better: string, natural: string])[];
};

export type Lesson = {
  id: string;
  slug: string;
  number: string;
  title: string;
  description: string;
  locale: ContentLocale;
  contentVersion: string;
  audioVersion: string;
  sentences: readonly Sentence[];
  scenes: readonly Scene[];
  prompts: readonly Prompt[];
  practice: LessonPractice;
  story: string;
  sources: readonly ContentSource[];
};
