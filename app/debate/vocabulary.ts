import words from "./common-words.json" with { type: "json" };
import { naturalPhraseTranslations } from "../natural-phrases.ts";
import { debatePhrases } from "./method.ts";

const commonWords = new Set(words);
const phrases: Record<string, string> = {
  ...naturalPhraseTranslations,
  ...debatePhrases,
  "i agree": "tôi đồng ý",
  "i disagree": "tôi không đồng ý",
  "in my opinion": "theo ý kiến của tôi",
  "i think": "tôi nghĩ",
  "what do you think": "bạn nghĩ sao",
  "for example": "ví dụ",
  "on the other hand": "mặt khác",
  "as far as i know": "theo những gì tôi biết",
  "a little bit": "một chút",
  "it depends": "còn tùy",
  "to be honest": "thật lòng mà nói",
  "you know": "bạn biết đấy",
  "kind of": "hơi, khá là",
  "sort of": "hơi, kiểu như",
  "sounds good": "nghe được đấy",
  "makes sense": "có lý",
  "keep going": "tiếp tục cố gắng",
  "every day": "mỗi ngày",
};
function normalize(text: string) {
  return text.toLowerCase().replace(/’/g, "'").replace(/\s+/g, " ");
}
const meanings = new Map(
  Object.entries(phrases).map(([phrase, meaning]) => [normalize(phrase), meaning]),
);
const phrasePattern = [...meanings.keys()]
  .sort((a, b) => b.length - a.length)
  .map((phrase) =>
    phrase
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/'/g, "['’]")
      .replace(/ /g, "\\s+"),
  )
  .join("|");
const pattern = new RegExp(
  `(?<![\\p{L}\\p{N}_'’])(?:${phrasePattern})(?![\\p{L}\\p{N}_'’])|[\\p{L}\\p{M}]+(?:['’][\\p{L}\\p{M}]+)*`,
  "giu",
);

export type VocabularyPart = { text: string; kind?: "phrase" | "common"; meaning?: string };

export function splitLearningText(text: string): VocabularyPart[] {
  const parts: VocabularyPart[] = [];
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > offset) parts.push({ text: text.slice(offset, match.index) });
    const token = normalize(match[0]);
    const meaning = meanings.get(token);
    const base =
      ({ "can't": "can", "won't": "will", "shan't": "shall" } as Record<string, string>)[token] ??
      token.replace(/n't$/, "").replace(/'(s|re|ve|ll|d|m)$/, "");
    parts.push({
      text: match[0],
      kind: meaning
        ? "phrase"
        : commonWords.has(token) || commonWords.has(base)
          ? "common"
          : undefined,
      ...(meaning ? { meaning } : {}),
    });
    offset = match.index + match[0].length;
  }
  if (offset < text.length) parts.push({ text: text.slice(offset) });
  return parts;
}
