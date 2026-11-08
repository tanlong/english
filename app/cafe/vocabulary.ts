import content from "./vocabulary-content.json" with { type: "json" };

export type CafeVocabularyWord = {
  id: string;
  english: string;
  vietnamese: string;
  example: string;
  exampleVi: string;
  usageVi: string;
};

export const cafeVocabulary: Record<string, CafeVocabularyWord[]> = Object.fromEntries(
  Object.entries(content).map(([topic, words]) => [
    topic,
    words.map(([english, vietnamese, example, usageVi, exampleVi]) => ({
      id: `cafe-vocab:${topic}:${english}`,
      english,
      vietnamese,
      example,
      exampleVi,
      usageVi,
    })),
  ]),
);
