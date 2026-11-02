export type Lexeme = { lemma: string; forms: string[]; meaningVi: string; source: string };
export type Lexicon = { version: string; approvedBy: string; entries: Lexeme[] };
const normalize = (s: string) => s.toLowerCase().replace(/’/g, "'");
export function analyzeLexicon(
  text: string,
  lexicon: Lexicon | null,
  expansions: string[] = [],
  excluded: string[] = [],
) {
  const core = new Map<string, string>();
  for (const entry of lexicon?.entries ?? [])
    for (const form of [entry.lemma, ...entry.forms]) core.set(normalize(form), entry.lemma);
  const expansion = new Set(expansions.map(normalize));
  const exclusions = new Set(excluded.map(normalize));
  const counts = { core: 0, expansion: 0, excluded: 0, unmapped: 0 };
  const unmapped = new Set<string>();
  const coreTypes = new Set<string>();
  const expansionTypes = new Set<string>();
  // Count English word tokens; times/numbers and punctuation do not enter the denominator.
  for (const token of normalize(text).match(/[a-z]+(?:'[a-z]+)*/g) ?? []) {
    if (exclusions.has(token)) counts.excluded++;
    else if (expansion.has(token)) {
      counts.expansion++;
      expansionTypes.add(token);
    } else if (core.has(token)) {
      counts.core++;
      coreTypes.add(core.get(token)!);
    } else {
      counts.unmapped++;
      unmapped.add(token);
    }
  }
  const total = counts.core + counts.expansion;
  return {
    ...counts,
    coverage: total ? (100 * counts.core) / total : null,
    coreTypes: coreTypes.size,
    expansionTypes: expansionTypes.size,
    unmappedWords: [...unmapped].sort(),
    official: !!lexicon && lexicon.entries.length === 1500 && !!lexicon.approvedBy,
    lexiconVersion: lexicon?.version ?? null,
  };
}
export function validateLexicon(value: unknown): value is Lexicon {
  const lexicon = value as Lexicon | null;
  if (
    !lexicon ||
    typeof lexicon.version !== "string" ||
    !lexicon.version.trim() ||
    typeof lexicon.approvedBy !== "string" ||
    !lexicon.approvedBy.trim() ||
    !Array.isArray(lexicon.entries) ||
    lexicon.entries.length !== 1500
  )
    return false;
  const forms = new Map<string, string>();
  for (const item of lexicon.entries) {
    if (
      !item ||
      typeof item.lemma !== "string" ||
      !/^[a-z]+$/.test(item.lemma) ||
      typeof item.meaningVi !== "string" ||
      !item.meaningVi.trim() ||
      !validUrl(item.source) ||
      !Array.isArray(item.forms) ||
      !item.forms.every((form) => typeof form === "string" && /^[a-z]+(?:'[a-z]+)*$/.test(form))
    )
      return false;
    for (const form of [item.lemma, ...item.forms]) {
      if (forms.has(form) && forms.get(form) !== item.lemma) return false;
      forms.set(form, item.lemma);
    }
  }
  return new Set(lexicon.entries.map((item) => item.lemma)).size === 1500;
}
export function validUrl(value: unknown): value is string {
  try {
    return typeof value === "string" && new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
