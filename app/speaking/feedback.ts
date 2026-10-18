export type SpokenVersions = {
  short: { en: string; vi: string };
  full: { en: string; vi: string };
  grammar?: { en: string; vi: string };
};

export function isSpokenVersions(value: unknown): value is SpokenVersions {
  if (!value || typeof value !== "object") return false;
  const versions = value as SpokenVersions;
  return [
    versions.short,
    versions.full,
    ...(versions.grammar === undefined ? [] : [versions.grammar]),
  ].every(
    (version) =>
      version &&
      typeof version.en === "string" &&
      Boolean(version.en.trim()) &&
      version.en.length <= 1500 &&
      typeof version.vi === "string" &&
      Boolean(version.vi.trim()) &&
      version.vi.length <= 2000,
  );
}
