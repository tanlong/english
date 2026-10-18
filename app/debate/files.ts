export const SOURCE_ACCEPT = ".txt,.srt";
export const MAX_SOURCE_BYTES = 1_000_000;
export const MIN_CONTENT_LENGTH = 80;
export const MAX_CONTENT_LENGTH = 60_000;

export function isSrtFile(file: Pick<File, "name">) {
  return file.name.toLowerCase().endsWith(".srt");
}

export function sourceFileError(file: Pick<File, "name" | "size" | "type">) {
  if (!/\.(txt|srt)$/i.test(file.name)) return "Chỉ hỗ trợ tệp văn bản .txt hoặc phụ đề .srt.";
  if (!file.size) return "Tệp đang trống. Hãy chọn tệp có nội dung tiếng Anh.";
  if (file.size > MAX_SOURCE_BYTES) return "Tệp vượt quá 1 MB. Hãy chọn đoạn nội dung ngắn hơn.";
  const mime = file.type.split(";")[0].toLowerCase();
  if (
    mime &&
    ![
      "text/plain",
      "application/x-subrip",
      "application/srt",
      "text/srt",
      "application/octet-stream",
    ].includes(mime)
  )
    return "Định dạng tệp không hợp lệ. Hãy chọn tệp TXT hoặc SRT dạng văn bản.";
  return "";
}

export async function readTextFile(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const encoding =
    bytes[0] === 0xff && bytes[1] === 0xfe
      ? "utf-16le"
      : bytes[0] === 0xfe && bytes[1] === 0xff
        ? "utf-16be"
        : "utf-8";
  return new TextDecoder(encoding, { fatal: true }).decode(bytes).replace(/\r\n?/g, "\n").trim();
}
