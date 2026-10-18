export type Approval = {
  revision: string;
  reviewer: string;
  at: string;
  evidence: string[];
};
export type EditorialRecord = {
  revision: string;
  language?: Approval;
  ipa?: Approval;
  illustration?: Approval;
  audio?: Approval;
  assessment?: Approval;
  lexicon: {
    status: "seed_only" | "approved";
    version: string;
    ratio: number | null;
  };
  rights: boolean;
  alt: string;
};
export function publicationIssues(record: EditorialRecord) {
  const issues: string[] = [];
  for (const key of ["language", "ipa", "illustration", "audio", "assessment"] as const) {
    const approval = record[key];
    if (
      !approval ||
      approval.revision !== record.revision ||
      !approval.reviewer.trim() ||
      !Number.isFinite(Date.parse(approval.at)) ||
      !approval.evidence.length
    )
      issues.push(`${key}: cần bằng chứng và phê duyệt đúng phiên bản`);
  }
  if (record.lexicon.status !== "approved")
    issues.push("Vietnam Spoken Core còn là seed; chưa được phép xuất bản");
  if (
    record.lexicon.ratio === null ||
    !Number.isFinite(record.lexicon.ratio) ||
    record.lexicon.ratio < 0.9 ||
    record.lexicon.ratio > 1 ||
    !record.lexicon.version
  )
    issues.push("Chưa có độ phủ ≥90% từ lexicon đã duyệt");
  if (!record.rights) issues.push("Chưa xác nhận quyền sử dụng hình ảnh");
  if (!record.alt.trim()) issues.push("Thiếu mô tả hình ảnh");
  return issues;
}
export function reviseContent(record: EditorialRecord, revision: string): EditorialRecord {
  return {
    revision,
    lexicon: { ...record.lexicon, ratio: null },
    rights: record.rights,
    alt: record.alt,
  };
}
export const draftEditorial: EditorialRecord = {
  revision: "practice-v1",
  lexicon: {
    status: "seed_only",
    version: "vietnam-spoken-core.seed.v1",
    ratio: null,
  },
  rights: false,
  alt: "Minh họa người trưởng thành trong sinh hoạt và công việc.",
};
