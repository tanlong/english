import type { DebateStance } from "./method.ts";

export type DebateAnalysis = {
  title: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  difficulty: { vocabularyVi: string; grammarVi: string };
  summaryVi: string;
  mainPoints: { textVi: string; evidenceIds: string[] }[];
  keySentences: { english: string; vietnamese: string; usageVi: string; evidenceId: string }[];
  evidence: { id: string; text: string }[];
  questions: string[];
};

export type DebateReply = {
  reply: string;
  translationVi: string;
  scope: "in_scope" | "out_of_scope" | "unsupported";
  warningVi: string;
  evidenceIds: string[];
};

export type DebateSession = {
  stance?: DebateStance;
  analysis: DebateAnalysis;
  source: "text" | "txt" | "srt";
  sourceName: string;
  token: string;
};

export type DebateTurn = { role: "user" | "assistant"; content: string };
