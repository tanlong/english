import type { BaselineLesson } from "./baseline.ts";
import { analyzeLexicon, validUrl, type Lexicon } from "./lexicon.ts";
export type ContentDraft = {
  lesson: BaselineLesson;
  expansions: string[];
  excludedProperNouns: string[];
  evidence: { cambridge: string; coca: string; youglish: string };
  ipaReviewed: boolean;
  assetRights: boolean;
  assetAlt: string;
  coverageException: string;
  audio: Record<string, { url: string; text: string; revision: number; textHash?: string }>;
};
export function newDraft(lesson: BaselineLesson): ContentDraft {
  return {
    lesson,
    expansions: [],
    excludedProperNouns: [],
    evidence: { cambridge: "", coca: "", youglish: "" },
    ipaReviewed: false,
    assetRights: false,
    assetAlt: "",
    coverageException: "",
    audio: {},
  };
}
export function authoredText(lesson: BaselineLesson) {
  return [
    ...lesson.segments.flatMap((segment) => [
      segment.prompt,
      segment.basic.en,
      segment.better.en,
      segment.natural.en,
    ]),
    ...(lesson.wisdom
      ? [lesson.wisdom.ideaEn, ...lesson.wisdom.dialogue.map((turn) => turn.en)]
      : []),
  ].join("\n");
}
export function contentIssues(draft: ContentDraft, lexicon: Lexicon | null, includeAudio = true) {
  const issues: string[] = [];
  const analysis = analyzeLexicon(
    authoredText(draft.lesson),
    lexicon,
    draft.expansions,
    draft.excludedProperNouns,
  );
  if (!analysis.official) issues.push("Cần bộ 1.500 lemma đã được người duyệt xác nhận.");
  if (analysis.unmapped) issues.push(`Còn ${analysis.unmapped} lượt từ chưa phân loại.`);
  if (analysis.coverage === null || (analysis.coverage < 95 && !draft.coverageException.trim()))
    issues.push("Độ phủ phải đạt 95% hoặc có lý do ngoại lệ được reviewer duyệt.");
  for (const [type, host] of [
    ["cambridge", "dictionary.cambridge.org"],
    ["coca", "english-corpora.org"],
    ["youglish", "youglish.com"],
  ] as const) {
    const url = draft.evidence[type];
    if (
      !validUrl(url) ||
      !(new URL(url).hostname === host || new URL(url).hostname === `www.${host}`)
    )
      issues.push(`Thiếu URL chứng cứ hợp lệ: ${type}.`);
  }
  if (!draft.ipaReviewed) issues.push("IPA/giọng Mỹ chưa được đối chiếu với câu cuối.");
  if (!draft.assetRights || !draft.assetAlt.trim())
    issues.push("Cần xác nhận quyền ảnh và mô tả ảnh.");
  if (draft.lesson.wisdom) {
    const wisdom = draft.lesson.wisdom;
    if (
      !/^\d{1,2}$/.test(wisdom.chapter) ||
      Number(wisdom.chapter) < 1 ||
      Number(wisdom.chapter) > 81 ||
      !validUrl(wisdom.textSource) ||
      !validUrl(wisdom.academicSource) ||
      !wisdom.interpretation.trim()
    )
      issues.push(
        "Applied Wisdom cần chương 1–81, nguồn văn bản, nguồn học thuật và nhãn diễn giải.",
      );
  }
  if (includeAudio)
    for (const segment of draft.lesson.segments)
      for (const level of ["basic", "better", "natural"] as const) {
        const audio = draft.audio[`${segment.id}:${level}`];
        if (
          !audio ||
          !validUrl(audio.url) ||
          audio.text !== segment[level].en ||
          audio.revision !== draft.lesson.revision
        )
          issues.push(`Audio thiếu hoặc cũ: ${segment.id}/${level}.`);
      }
  return { issues, analysis };
}
const bounded = (value: unknown, max = 2000): value is string =>
  typeof value === "string" && value.length <= max;
const text = (value: unknown, max = 2000): value is string => bounded(value, max) && !!value.trim();
export function validDraft(value: unknown): value is ContentDraft {
  const d = value as ContentDraft | null;
  if (
    !d ||
    !d.lesson ||
    !Array.isArray(d.expansions) ||
    !Array.isArray(d.excludedProperNouns) ||
    ![...d.expansions, ...d.excludedProperNouns].every(
      (word) => text(word, 100) && /^[a-z]+(?:'[a-z]+)*$/i.test(word),
    ) ||
    !d.evidence ||
    !Object.values(d.evidence).every((url) => bounded(url)) ||
    !["cambridge", "coca", "youglish"].every((key) =>
      bounded(d.evidence[key as keyof typeof d.evidence]),
    ) ||
    typeof d.ipaReviewed !== "boolean" ||
    typeof d.assetRights !== "boolean" ||
    !bounded(d.assetAlt) ||
    !bounded(d.coverageException) ||
    !d.audio ||
    typeof d.audio !== "object" ||
    Array.isArray(d.audio)
  )
    return false;
  const l = d.lesson;
  if (
    !text(l.id, 100) ||
    !text(l.slug, 100) ||
    !/^[a-z0-9-]+$/.test(l.slug) ||
    !text(l.title, 200) ||
    !text(l.description) ||
    !["everyday", "workplace", "communication"].includes(l.topic) ||
    !Number.isInteger(l.week) ||
    l.week < 1 ||
    l.week > 52 ||
    !Number.isInteger(l.revision) ||
    l.revision < 1 ||
    !Array.isArray(l.segments) ||
    !l.segments.length ||
    l.segments.length > 100
  )
    return false;
  if (
    !l.segments.every(
      (s) =>
        s &&
        text(s.id, 100) &&
        /^[a-z0-9-]+$/.test(s.id) &&
        ["morning", "school", "breakfast", "office", "home"].includes(s.scene) &&
        text(s.prompt) &&
        [s.basic, s.better, s.natural].every((v) => v && text(v.en, 1500) && text(v.vi)),
    )
  )
    return false;
  if (new Set(l.segments.map((s) => s.id)).size !== l.segments.length) return false;
  if (
    !Object.values(d.audio).every(
      (a) => a && bounded(a.url) && text(a.text, 1500) && Number.isInteger(a.revision),
    )
  )
    return false;
  if (l.wisdom) {
    const w = l.wisdom;
    if (
      ![w.ideaEn, w.ideaVi, w.situation, w.chapter, w.interpretation].every((v) => text(v)) ||
      !bounded(w.textSource) ||
      !bounded(w.academicSource) ||
      !Array.isArray(w.dialogue) ||
      w.dialogue.length < 2 ||
      w.dialogue.length > 4 ||
      !w.dialogue.every((t) => t && text(t.role, 100) && text(t.en, 1500) && text(t.vi))
    )
      return false;
  }
  return true;
}
