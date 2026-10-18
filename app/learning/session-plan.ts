export type SessionStageId =
  | "review" // Legacy session import only.
  | "visual-listening"
  | "shadowing"
  | "speaking"
  | "read-write"
  | "communication-listening"
  | "communication-speaking"
  | "reflection";
export type SessionStage = {
  id: SessionStageId;
  label: string;
  minutes: number;
  skill: "listening-speaking" | "reading-writing";
  contentSeconds: { everyday: number; carnegie: number };
  detail: string;
};
export const sessionStages: readonly SessionStage[] = [
  {
    id: "visual-listening",
    label: "Nghe mẫu",
    minutes: 2,
    skill: "listening-speaking",
    contentSeconds: { everyday: 48, carnegie: 72 },
    detail:
      "Nghe mẫu đời sống/công việc, rồi nghe một tình huống Đắc Nhân Tâm để chọn cách phản hồi.",
  },
  {
    id: "speaking",
    label: "Bạn lên tiếng",
    minutes: 8,
    skill: "listening-speaking",
    contentSeconds: { everyday: 432, carnegie: 48 },
    detail:
      "Nghe và đáp lời qua 3 lượt: trả lời, ứng biến và phản hồi thể hiện quan tâm. Không cần thuộc câu mẫu.",
  },
  {
    id: "reflection",
    label: "Dùng ngoài đời",
    minutes: 2,
    skill: "reading-writing",
    contentSeconds: { everyday: 96, carnegie: 24 },
    detail: "Thử nói lại một ý bằng lời của bạn, rồi giữ một câu để dùng hôm nay.",
  },
];
export function createSessionPlan() {
  const sum = (predicate: (s: SessionStage) => boolean) =>
    sessionStages.filter(predicate).reduce((n, s) => n + s.minutes, 0);
  return {
    duration: sum(() => true),
    stages: sessionStages,
    contentLedgerSeconds: {
      everyday: sessionStages.reduce((n, s) => n + s.contentSeconds.everyday, 0),
      carnegie: sessionStages.reduce((n, s) => n + s.contentSeconds.carnegie, 0),
    },
    ledger: {
      total: sum(() => true),
      listeningSpeaking: sum((s) => s.skill === "listening-speaking"),
      readingWriting: sum((s) => s.skill === "reading-writing"),
    },
  };
}
