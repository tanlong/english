import { getPracticeLesson } from "../content/practice.ts";
import { dateKey, emptyState, type LearningState } from "./progress.ts";

export type ReviewItem = {
  id: string;
  labelVi: string;
  english: string;
  vietnamese: string;
  evidenceVi: string;
  dueAt: string;
  successes: number;
};
export type LearnerMemory = {
  summaryVi: string;
  completedLessons: number;
  learnerTurns: number;
  recentTopics: string[];
  reviews: ReviewItem[];
};
export type PersonalRecord = {
  key: string;
  kind: string;
  topic: string;
  completed: boolean;
  updatedAt: string;
  turns: string[];
  corrections: { original: string; corrected: string; noteVi: string }[];
};
export type ApprovedExample = {
  id: string;
  english: string;
  vietnamese: string;
  usageVi: string;
};
export type PersonalTopic = {
  id: string;
  label: string;
  content: string;
  reasonVi: string;
  focusEn: string;
  updatedAt: string;
};
export type Personalization = {
  memory: LearnerMemory;
  topic: PersonalTopic;
  examples: ApprovedExample[];
};

// Merge recorded evidence rather than replacing another tab's completed work.
export function mergeLearningState(saved: LearningState, incoming: LearningState): LearningState {
  const sessions = { ...saved.sessions };
  for (const [key, next] of Object.entries(incoming.sessions)) {
    const old = sessions[key];
    if (!old) {
      sessions[key] = next;
      continue;
    }
    const attempts = new Map(old.attempts.map((a) => [a.id, a]));
    for (const attempt of next.attempts) attempts.set(attempt.id, attempt);
    const completed = [...new Set([...old.completed, ...next.completed])];
    sessions[key] = {
      ...next,
      attempts: [...attempts.values()],
      completed,
      seconds: next.seconds.map((seconds, i) => Math.max(seconds, old.seconds[i] ?? 0)),
      drafts: { ...old.drafts, ...next.drafts },
      ...(old.finishedAt || next.finishedAt
        ? { finishedAt: old.finishedAt || next.finishedAt }
        : {}),
    };
  }
  return {
    ...incoming,
    profile: incoming.profile ?? saved.profile,
    sessions,
    dailySeconds: Object.fromEntries(
      [...new Set([...Object.keys(saved.dailySeconds), ...Object.keys(incoming.dailySeconds)])].map(
        (key) => [key, Math.max(saved.dailySeconds[key] ?? 0, incoming.dailySeconds[key] ?? 0)],
      ),
    ),
    ipaPracticed: [...new Set([...(saved.ipaPracticed ?? []), ...(incoming.ipaPracticed ?? [])])],
  };
}

const normal = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const dayAfter = (at: string, days: number) =>
  new Date(Date.parse(at) + days * 86_400_000).toISOString();

export function buildLearnerMemory(
  state: LearningState,
  records: PersonalRecord[],
  dismissed: string[] = [],
): LearnerMemory {
  const completed = Object.values(state.sessions)
    .filter((s) => s.finishedAt)
    .sort((a, b) => b.finishedAt!.localeCompare(a.finishedAt!));
  const finishedRecords = records.filter((r) => r.completed);
  const reviews = new Map<string, ReviewItem>();
  const listeningAttempts = Object.values(state.sessions)
    .flatMap((session) =>
      session.attempts
        .filter((a) => a.kind === "listening" && a.correct !== undefined)
        .map((attempt) => ({ session, attempt })),
    )
    .sort((a, b) => a.attempt.at.localeCompare(b.attempt.at));
  for (const { session, attempt } of listeningAttempts) {
    const role = session.key.match(/-(general|itba|ux|ui|pm|developer|po)(?:-r\d+)?$/)?.[1] as
      NonNullable<LearningState["profile"]>["role"] | undefined;
    const lesson = getPracticeLesson(session.week, session.day, role ?? "general");
    const id = `listening:${session.week}:${session.day}:${attempt.contentTrack ?? "everyday"}`;
    if (attempt.correct) {
      if (!attempt.captions) reviews.delete(id);
      continue;
    }
    const carnegie = attempt.contentTrack === "carnegie";
    reviews.set(id, {
      id,
      labelVi: carnegie ? lesson.principle : lesson.title,
      english: carnegie ? lesson.communication.reply : lesson.target,
      vietnamese: carnegie ? lesson.communication.meanings[1] : lesson.targetVi,
      evidenceVi:
        "Bạn đã chọn khác đáp án ở bài nghe. Đây là gợi ý ôn nghe, chưa kết luận lỗi ngữ pháp hay phát âm.",
      dueAt: dayAfter(attempt.at, 1),
      successes: 0,
    });
  }
  for (const record of finishedRecords)
    for (const correction of record.corrections) {
      const id = `phrase:${normal(correction.corrected)}`;
      if (reviews.has(id)) continue;
      const target = normal(correction.corrected);
      const laterUses = finishedRecords.filter(
        (r) => r.updatedAt > record.updatedAt && r.turns.some((t) => normal(t) === target),
      );
      const latest = laterUses.at(0)?.updatedAt ?? record.updatedAt;
      reviews.set(id, {
        id,
        labelVi: "Diễn đạt cần ôn",
        english: correction.corrected,
        vietnamese: "Đối chiếu câu gốc và tự nói lại trong tình huống mới.",
        evidenceVi: `Bạn nói: ${correction.original}. Gợi ý AI: ${correction.noteVi}. Đây là nhận xét AI, bạn có thể bỏ ghi nhớ nếu chưa phù hợp.`,
        dueAt: dayAfter(latest, laterUses.length >= 3 ? 7 : laterUses.length ? 3 : 1),
        successes: laterUses.length,
      });
    }
  const recentTopics = [
    ...new Set([
      ...finishedRecords.map((r) => r.topic),
      ...completed.map(
        (s) => getPracticeLesson(s.week, s.day, state.profile?.role ?? "general").title,
      ),
    ]),
  ].slice(0, 6);
  const learnerTurns = finishedRecords.reduce((n, r) => n + r.turns.length, 0);
  return {
    summaryVi: `${completed.length} buổi học đã hoàn thành; ${learnerTurns} lượt trao đổi đã lưu.${recentTopics.length ? ` Chủ đề gần đây: ${recentTopics.join(", ")}.` : " Chưa có buổi học hoàn tất để rút ra điểm cần ôn."}`,
    completedLessons: completed.length,
    learnerTurns,
    recentTopics,
    reviews: [...reviews.values()]
      .filter((r) => !dismissed.includes(r.id))
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
      .slice(0, 12),
  };
}

// Original practice texts: factual claims about a learner are never inserted here.
const topics = [
  {
    id: "routine",
    label: "Nên ăn sáng ở nhà hay trên đường đi làm?",
    tags: "routine breakfast morning food",
    work: false,
    content:
      "Is it better to have breakfast at home or grab something on the way to work? At home, people can choose what to make and take their time. Buying breakfast on the way may be easier on a busy morning, but there may be a line. People can make different choices depending on their time and what they like. Which choice would work better for you, and why?",
  },
  {
    id: "family-time",
    label: "Có nên để điện thoại sang một bên khi ăn cùng gia đình?",
    tags: "family home phone dinner",
    work: false,
    content:
      "Should people put their phones away during family meals? Some people want to focus on the people at the table. Others may need to answer an important message. A family could agree to keep phones away unless something urgent happens. Different families may need different rules. What rule would you suggest, and why?",
  },
  {
    id: "learning",
    label: "Luyện tiếng Anh mỗi ngày hay học lâu vào cuối tuần?",
    tags: "english learning practice weekend",
    work: false,
    content:
      "Is it better to practice English for a short time every day or study longer on weekends? Short sessions may fit a busy day and give people more chances to use a phrase. A longer session may leave more time for a full conversation. The best choice may depend on a person's routine. What would you choose, and how would you make time for it?",
  },
  {
    id: "team",
    label: "Đội nên họp nhanh mỗi ngày hay gửi cập nhật bằng tin nhắn?",
    tags: "team task update meeting work",
    work: true,
    content:
      "Should a team have a short meeting every day or share updates in messages? A meeting lets people ask questions right away. Messages let people read an update when they have time. Some teams may need both, especially when a task is unclear. Think about a team with a busy schedule. Which approach would you suggest, and why?",
  },
  {
    id: "release",
    label: "Nên phát hành đúng hẹn hay dành thêm thời gian kiểm thử?",
    tags: "developer bug testing release software",
    work: true,
    content:
      "A software team plans to release a feature on Friday, but a few tests are not finished. Releasing on time could help users get the feature sooner. Waiting could give the team more time to check for problems. The team needs to discuss how serious the remaining issues are. What should they check before deciding, and which option would you choose?",
  },
  {
    id: "design",
    label: "Thiết kế đơn giản hay nhiều tính năng hơn?",
    tags: "design ui ux user screen feature",
    work: true,
    content:
      "Should an app offer many features or keep its main screen simple? More features may help people do different tasks. A simple screen may be easier for a new user to understand. Designers could show the main actions first and put extra options in another place. Think about an app you use often. Which approach would you prefer, and why?",
  },
  {
    id: "feedback",
    label: "Góp ý ngay hay chờ lúc người kia sẵn sàng?",
    tags: "feedback listening respect concern mistake",
    work: false,
    content:
      "When someone makes a mistake, should we give feedback right away or ask when they are ready to talk? Quick feedback may help fix a problem sooner. Waiting for a quiet moment may make the conversation easier. In either case, we can describe the problem clearly and listen to the other person. How would you choose the right moment and keep the conversation respectful?",
  },
  {
    id: "cooperation",
    label: "Tự giải quyết vấn đề hay nhờ người khác giúp?",
    tags: "help cooperation coworker appreciation",
    work: true,
    content:
      "When a task is difficult, should we keep trying alone or ask someone for help? Trying alone can give us time to understand the problem. Asking for help can bring in another point of view, but the other person may be busy. We can explain what we have tried and ask a clear question. When would you ask for help, and what would you say?",
  },
] as const;

export function choosePersonalTopic(
  state: LearningState,
  memory: LearnerMemory,
  offset = 0,
  now = new Date(),
): PersonalTopic {
  const due = memory.reviews.find((r) => r.dueAt <= now.toISOString());
  const clues = new Set(
    normal(
      [due?.english, ...memory.recentTopics, state.profile?.role].filter(Boolean).join(" "),
    ).split(" "),
  );
  const ranked = topics
    .map((topic) => ({
      topic,
      score:
        topic.tags.split(" ").filter((word) => clues.has(word)).length * 3 +
        (topic.work && state.profile?.goal === "workplace"
          ? 2
          : !topic.work && state.profile?.goal === "everyday"
            ? 2
            : 0),
    }))
    .sort((a, b) => b.score - a.score);
  const eligible = ranked.filter((r) => r.score === ranked[0].score);
  const day = Math.floor(Date.parse(`${dateKey(now)}T00:00:00Z`) / 86_400_000);
  const base = ranked.indexOf(eligible[day % eligible.length]);
  const topic = ranked[(base + offset) % ranked.length].topic;
  return {
    id: topic.id,
    label: topic.label,
    content: topic.content,
    reasonVi: due
      ? `Gợi ý theo nội dung cần ôn: ${due.labelVi}.`
      : memory.recentTopics.length
        ? `Gợi ý theo chủ đề gần đây: ${memory.recentTopics[0]}.`
        : state.profile?.goal === "workplace"
          ? "Gợi ý theo mục tiêu giao tiếp công việc của bạn."
          : "Bài khởi động; gợi ý sẽ sát hơn khi có kết quả học.",
    focusEn: due?.english ?? "I think… because… For example…",
    updatedAt: now.toISOString(),
  };
}

export function emptyPersonalization(): Personalization {
  const state = emptyState();
  const memory = buildLearnerMemory(state, []);
  return { memory, topic: choosePersonalTopic(state, memory), examples: [] };
}
