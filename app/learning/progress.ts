import { roles, type Role } from "../content/curriculum.ts";
import { ipaSounds } from "../content/ipa.ts";
import { sessionStages, type SessionStageId } from "./session-plan.ts";
import { parseReviews, parseVisits, type CardReview, type LessonVisit } from "./review.ts";
export const STORAGE_KEY = "natural-english:v2";
export type Profile = {
  name: string;
  role: Role;
  goal: "both" | "everyday" | "workplace";
  confidence: "new" | "some" | "comfortable";
  largeText: boolean;
  mic: boolean;
  goalMinutes?: 5 | 10 | 15 | 30 | 60;
  vietnameseHelp?: boolean;
  baseline?: { listeningCorrect: boolean; response: string; completedAt: string };
};
export type Attempt = {
  id: string;
  stage: SessionStageId;
  kind: "listening" | "speaking" | "typed" | "writing" | "takeaway" | "shadowing";
  answer: string;
  correct?: boolean;
  captions?: boolean;
  replays?: number;
  contentTrack?: "everyday" | "carnegie";
  at: string;
};
export type StudySession = {
  planVersion: "conversation-v1" | "conversation-v2";
  key: string;
  week: number;
  day: number;
  stage: number;
  completed: SessionStageId[];
  seconds: number[];
  attempts: Attempt[];
  drafts: Record<string, string>;
  finishedAt?: string;
};
export type LearningState = {
  version: 2;
  profile: Profile | null;
  activeWeek: number;
  activeDay: number;
  sessions: Record<string, StudySession>;
  dailySeconds: Record<string, number>;
  ipaPracticed?: string[];
  cardReviews?: Record<string, CardReview>;
  lessonVisits?: Record<string, LessonVisit>;
};
export function emptyState(): LearningState {
  return {
    version: 2,
    profile: null,
    activeWeek: 1,
    activeDay: 1,
    sessions: {},
    dailySeconds: {},
    ipaPracticed: [],
    cardReviews: {},
    lessonVisits: {},
  };
}
export function dateKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function sessionKey(week: number, day: number, role: Role) {
  return `w${week}-d${day}-${role}`;
}
export function nextLesson(state: LearningState) {
  const completed = new Set(
    Object.values(state.sessions)
      .filter((session) => session.finishedAt)
      .map((session) => `${session.week}-${session.day}`),
  );
  for (let week = 1; week <= 52; week++)
    for (let day = 1; day <= 6; day++) if (!completed.has(`${week}-${day}`)) return { week, day };
  return null;
}
export function lessonAccess(state: LearningState, week: number, day: number) {
  const completed = Object.values(state.sessions).some(
    (session) => session.week === week && session.day === day && !!session.finishedAt,
  );
  if (completed) return { status: "completed" as const, prerequisite: null };
  return { status: "available" as const, prerequisite: null };
}
export function openLesson(
  state: LearningState,
  week: number,
  day: number,
  role: Role,
): { state: LearningState; key: string | null } {
  if (
    !Number.isInteger(week) ||
    week < 1 ||
    week > 52 ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > 6
  )
    return { state, key: null };
  const base = sessionKey(week, day, role);
  let key = base;
  if (state.sessions[base]?.finishedAt) {
    const replays = Object.keys(state.sessions)
      .filter((candidate) => candidate.startsWith(`${base}-r`))
      .sort((a, b) => Number(b.slice(base.length + 2)) - Number(a.slice(base.length + 2)));
    key =
      replays.find((candidate) => !state.sessions[candidate].finishedAt) ??
      `${base}-r${replays.length ? Number(replays[0].slice(base.length + 2)) + 1 : 1}`;
  }
  return {
    key,
    state: {
      ...state,
      activeWeek: week,
      activeDay: day,
      sessions: {
        ...state.sessions,
        [key]: state.sessions[key] ?? { ...newSession(week, day, role), key },
      },
    },
  };
}
export function newSession(week: number, day: number, role: Role): StudySession {
  return {
    planVersion: "conversation-v2",
    key: sessionKey(week, day, role),
    week,
    day,
    stage: 0,
    completed: [],
    seconds: sessionStages.map(() => 0),
    attempts: [],
    drafts: {},
  };
}
export function addActiveSeconds(
  state: LearningState,
  key: string,
  delta: number,
  today = dateKey(),
): LearningState {
  const session = state.sessions[key];
  if (!session || session.finishedAt || !Number.isFinite(delta) || delta <= 0) return state;
  const available = Math.max(0, 3600 - (state.dailySeconds[today] ?? 0));
  const seconds = Math.min(available, delta);
  if (!seconds) return state;
  return {
    ...state,
    dailySeconds: {
      ...state.dailySeconds,
      [today]: (state.dailySeconds[today] ?? 0) + seconds,
    },
    sessions: {
      ...state.sessions,
      [key]: {
        ...session,
        seconds: session.seconds.map((n, i) => (i === session.stage ? n + seconds : n)),
      },
    },
  };
}
export function addAttempt(session: StudySession, attempt: Attempt): StudySession {
  if (session.attempts.some((a) => a.id === attempt.id)) return session;
  return { ...session, attempts: [...session.attempts, attempt] };
}
export function completeStage(session: StudySession, now = new Date()): StudySession {
  const stage = sessionStages[session.stage];
  if (!stageReady(session, stage.id)) return session;
  const completed = [...new Set([...session.completed, stage.id])];
  const next = sessionStages.findIndex((s) => !completed.includes(s.id));
  return {
    ...session,
    completed,
    stage: next < 0 ? session.stage : next,
    ...(next < 0 ? { finishedAt: now.toISOString() } : {}),
  };
}
export function stageReady(session: StudySession, stage: SessionStageId) {
  const attempts = session.attempts.filter((a) => a.stage === stage);
  if (session.planVersion === "conversation-v2") {
    if (stage === "visual-listening")
      return ["everyday", "carnegie"].every((track) =>
        attempts.some((a) => a.kind === "listening" && a.contentTrack === track),
      );
    if (stage === "speaking")
      return (
        attempts.filter((a) => a.kind === "speaking" || a.kind === "typed").length >= 3 &&
        attempts.some(
          (a) => (a.kind === "speaking" || a.kind === "typed") && a.contentTrack === "carnegie",
        )
      );
    if (stage === "reflection")
      return (
        attempts.some((a) => a.kind === "takeaway") &&
        attempts.some((a) => a.kind === "writing" && a.contentTrack === "carnegie")
      );
  }
  if (stage === "speaking" || stage === "communication-speaking")
    return attempts.filter((a) => a.kind === "speaking" || a.kind === "typed").length >= 3;
  return attempts.length > 0;
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const validNumber = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
// Retain old activity evidence when importing an eight-stage session.
const legacyStageIds: SessionStageId[] = [
  "review",
  "visual-listening",
  "shadowing",
  "speaking",
  "read-write",
  "communication-listening",
  "communication-speaking",
  "reflection",
];
const legacyMinutes = [8, 15, 7, 8, 10, 6, 4, 2];
const stageIds = new Set(legacyStageIds);
const mergedStage = (id: SessionStageId): SessionStageId =>
  id === "communication-listening"
    ? "visual-listening"
    : id === "communication-speaking"
      ? "speaking"
      : id;
export function parseState(raw: string | null): LearningState {
  const fallback = emptyState();
  if (!raw) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    if (!object(value) || value.version !== 2) return fallback;
    if (object(value.profile)) {
      const p = value.profile;
      if (
        typeof p.name === "string" &&
        roles.some((r) => r.id === p.role) &&
        ["both", "everyday", "workplace"].includes(String(p.goal)) &&
        ["new", "some", "comfortable"].includes(String(p.confidence))
      )
        fallback.profile = {
          name: p.name.slice(0, 60),
          role: p.role as Role,
          goal: p.goal as Profile["goal"],
          confidence: p.confidence as Profile["confidence"],
          largeText: p.largeText === true,
          mic: p.mic === true,
          goalMinutes: [5, 10, 15, 30, 60].includes(Number(p.goalMinutes))
            ? (p.goalMinutes as Profile["goalMinutes"])
            : 15,
          vietnameseHelp: p.vietnameseHelp !== false,
          ...(object(p.baseline) &&
          typeof p.baseline.listeningCorrect === "boolean" &&
          typeof p.baseline.response === "string" &&
          p.baseline.response.length <= 1500 &&
          typeof p.baseline.completedAt === "string" &&
          Number.isFinite(Date.parse(p.baseline.completedAt))
            ? {
                baseline: {
                  listeningCorrect: p.baseline.listeningCorrect,
                  response: p.baseline.response,
                  completedAt: p.baseline.completedAt,
                },
              }
            : {}),
        };
    }
    if (Number.isInteger(value.activeWeek) && validNumber(value.activeWeek, 1, 52))
      fallback.activeWeek = value.activeWeek;
    if (Number.isInteger(value.activeDay) && validNumber(value.activeDay, 1, 6))
      fallback.activeDay = value.activeDay;
    fallback.cardReviews = parseReviews(value.cardReviews);
    fallback.lessonVisits = parseVisits(value.lessonVisits);
    if (Array.isArray(value.ipaPracticed))
      fallback.ipaPracticed = [
        ...new Set(
          value.ipaPracticed.filter(
            (id): id is string =>
              typeof id === "string" && ipaSounds.some((sound) => sound.id === id),
          ),
        ),
      ];
    if (object(value.dailySeconds))
      for (const [key, n] of Object.entries(value.dailySeconds))
        if (/^\d{4}-\d{2}-\d{2}$/.test(key) && validNumber(n, 0, 86400))
          fallback.dailySeconds[key] = n;
    if (object(value.sessions))
      for (const [key, s] of Object.entries(value.sessions)) {
        const legacy = object(s) && s.planVersion === undefined;
        const stageCount = legacy ? legacyStageIds.length : sessionStages.length;
        if (
          !/^w\d+-d[1-6]-(general|itba|ux|ui|pm|developer|po)(?:-r[1-9]\d*)?$/.test(key) ||
          !object(s) ||
          s.key !== key ||
          !Number.isInteger(s.week) ||
          !validNumber(s.week, 1, 52) ||
          !Number.isInteger(s.day) ||
          !validNumber(s.day, 1, 6) ||
          !Number.isInteger(s.stage) ||
          !validNumber(s.stage, 0, stageCount - 1) ||
          (!legacy && !["conversation-v1", "conversation-v2"].includes(String(s.planVersion))) ||
          !Array.isArray(s.seconds) ||
          s.seconds.length !== stageCount ||
          !s.seconds.every((n, i) =>
            validNumber(n, 0, legacy ? legacyMinutes[i] * 60 : Number.MAX_SAFE_INTEGER),
          )
        )
          continue;
        const attempts = Array.isArray(s.attempts)
          ? s.attempts
              .filter(
                (a): a is Omit<Attempt, "kind"> & { kind: Attempt["kind"] | "review" } =>
                  object(a) &&
                  typeof a.id === "string" &&
                  stageIds.has(a.stage as SessionStageId) &&
                  [
                    "listening",
                    "speaking",
                    "typed",
                    "writing",
                    "takeaway",
                    "shadowing",
                    "review",
                  ].includes(String(a.kind)) &&
                  typeof a.answer === "string" &&
                  typeof a.at === "string" &&
                  Number.isFinite(Date.parse(a.at)) &&
                  (a.correct === undefined || typeof a.correct === "boolean") &&
                  (a.captions === undefined || typeof a.captions === "boolean") &&
                  (a.contentTrack === undefined ||
                    ["everyday", "carnegie"].includes(String(a.contentTrack))) &&
                  (a.replays === undefined || validNumber(a.replays, 0, 10000)),
              )
              .map((a) => ({ ...a, kind: a.kind === "review" ? ("takeaway" as const) : a.kind }))
          : [];
        const completed = Array.isArray(s.completed)
          ? [
              ...new Set(
                s.completed
                  .filter(
                    (id): id is SessionStageId =>
                      stageIds.has(id as SessionStageId) && attempts.some((a) => a.stage === id),
                  )
                  .map((id) => (legacy ? mergedStage(id) : id))
                  .filter((id) => sessionStages.some((stage) => stage.id === id)),
              ),
            ]
          : [];
        const drafts = object(s.drafts)
          ? (Object.fromEntries(
              Object.entries(s.drafts).filter(([, v]) => typeof v === "string"),
            ) as Record<string, string>)
          : {};
        const migratedAttempts = legacy
          ? attempts.map((a) => ({ ...a, stage: mergedStage(a.stage) }))
          : attempts;
        const seconds = s.seconds as number[];
        const migrated: StudySession = {
          planVersion: s.planVersion === "conversation-v2" ? "conversation-v2" : "conversation-v1",
          key,
          week: s.week,
          day: s.day,
          stage: legacy
            ? Math.max(
                0,
                sessionStages.findIndex((stage) => !completed.includes(stage.id)),
              )
            : s.stage,
          // Preserve every recorded second, including activities now offered as extras.
          seconds: legacy
            ? [
                seconds[0] + seconds[1] + seconds[2] + seconds[5],
                seconds[3] + seconds[6],
                seconds[4] + seconds[7],
              ]
            : seconds,
          completed,
          attempts: migratedAttempts,
          drafts,
          ...(completed.length === sessionStages.length &&
          typeof s.finishedAt === "string" &&
          Number.isFinite(Date.parse(s.finishedAt))
            ? { finishedAt: s.finishedAt }
            : {}),
        };
        migrated.completed = completed.filter((id) => stageReady(migrated, id));
        if (migrated.completed.length !== sessionStages.length) delete migrated.finishedAt;
        if (legacy && !migrated.finishedAt)
          migrated.stage = Math.max(
            0,
            sessionStages.findIndex((stage) => !migrated.completed.includes(stage.id)),
          );
        fallback.sessions[key] = migrated;
      }
    return fallback;
  } catch {
    return fallback;
  }
}
