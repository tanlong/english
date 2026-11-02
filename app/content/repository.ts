import { getDb } from "../db/client.ts";
import type { ContentDraft } from "./governance.ts";
import type { Lexicon } from "./lexicon.ts";
export async function readLexicon() {
  const row = await getDb().coreLexicon.findFirst({ orderBy: { createdAt: "desc" } });
  return row ? (JSON.parse(row.dataJson) as Lexicon) : null;
}
export async function publishedLessons() {
  const rows = await getDb().contentDocument.findMany({ where: { publishedJson: { not: null } } });
  return rows.map((row) => JSON.parse(row.publishedJson!) as ContentDraft);
}
