import { readTextFile } from "./files.ts";

export function parseSrt(content: string) {
  const blocks = content
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .split(/\n[ \t]*\n/);
  const transcript: string[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    if (/^\s*\d+\s*$/.test(lines[0])) lines.shift();
    const timing = lines
      .shift()
      ?.trim()
      .match(
        /^(\d{2,}):([0-5]\d):([0-5]\d)[,.](\d{3})\s+-->\s+(\d{2,}):([0-5]\d):([0-5]\d)[,.](\d{3})(?:[ \t]+.*)?$/,
      );
    if (!timing) throw new Error("Invalid SRT timing");
    const start =
      ((Number(timing[1]) * 60 + Number(timing[2])) * 60 + Number(timing[3])) * 1000 +
      Number(timing[4]);
    const end =
      ((Number(timing[5]) * 60 + Number(timing[6])) * 60 + Number(timing[7])) * 1000 +
      Number(timing[8]);
    if (!Number.isFinite(end) || end <= start) throw new Error("Invalid SRT duration");
    const text = lines
      .join(" ")
      .replace(/<\/?(?:b|i|u|font)(?:\s[^>]*)?>/gi, "")
      .replace(/\{\\[^}]*\}/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) throw new Error("Empty SRT cue");
    transcript.push(text);
  }
  return transcript.join("\n");
}

export async function readSrtFile(file: File) {
  return parseSrt(await readTextFile(file));
}
