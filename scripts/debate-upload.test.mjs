import assert from "node:assert/strict";
import { test } from "node:test";
import { POST } from "../app/api/debate/upload/route.ts";
import { readContext } from "../app/debate/server.ts";
import { MAX_SOURCE_BYTES, sourceFileError, readTextFile } from "../app/debate/files.ts";
import { parseSrt, readSrtFile } from "../app/debate/srt.ts";

const content =
  "Small habits make a big difference. Practice every day to build a habit. Start with five minutes every day. This makes it easier to keep going.";
const srt = `\uFEFF1\r\n00:00:00,000 --> 00:00:10,000\r\n<i>${content}</i>\r\n`;
function request({
  consent = "true",
  file = new File([content], "lesson.txt", { type: "text/plain" }),
  origin = "http://localhost",
  stance,
} = {}) {
  const body = new FormData();
  body.set("consent", consent);
  if (stance !== undefined) body.set("stance", stance);
  if (file) body.set("file", file);
  return new Request("http://localhost/api/debate/upload", {
    method: "POST",
    headers: { Origin: origin },
    body,
  });
}

test("TXT and SRT create debates from text only and reject media and oversized uploads", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  let calls = 0;
  let fail = false;
  process.env.OPENAI_API_KEY = "test-key";
  globalThis.fetch = async (url, options) => {
    assert.equal(
      url,
      "https://api.openai.com/v1/responses",
      "Files must never be sent to an audio/video API",
    );
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    assert.ok(options.signal);
    calls++;
    if (fail) return Response.json({ error: "unavailable" }, { status: 502 });
    const input = JSON.parse(body.input[0].content);
    assert.ok(["txt", "srt"].includes(input.source));
    assert.ok(["undecided", "agree", "disagree"].includes(input.learnerStance));
    assert.equal(input.sourceExcerpts[0].text, "Small habits make a big difference.");
    const output = {
      title: "Thói quen nhỏ",
      level: "B1",
      difficulty: { vocabularyVi: "Từ thông dụng.", grammarVi: "Câu đơn." },
      summaryVi: "Bắt đầu nhỏ và luyện tập mỗi ngày.",
      evidence: ["E1", "E2"],
      mainPoints: [{ textVi: "Thói quen nhỏ có tác dụng.", evidenceIds: ["E1"] }],
      keySentences: [
        {
          vietnamese: "Thói quen nhỏ tạo ra khác biệt lớn.",
          usageVi: "Động viên thay đổi nhỏ.",
          evidenceId: "E1",
        },
      ],
      questions: ["Do small habits make a big difference?"],
    };
    return Response.json({
      status: "completed",
      output: [{ content: [{ type: "output_text", text: JSON.stringify(output) }] }],
    });
  };
  try {
    assert.equal((await POST(request({ origin: "https://other.test" }))).status, 403);
    assert.equal((await POST(request({ consent: "false" }))).status, 400);
    assert.equal((await POST(request({ file: null }))).status, 400);
    assert.equal((await POST(request({ stance: "ignore scope" }))).status, 400);
    for (const file of [
      new File([], "empty.txt"),
      new File(["data"], "clip.mp4", { type: "video/mp4" }),
      new File(["data"], "audio.mp3", { type: "audio/mpeg" }),
      new File(["data"], "bad.exe"),
      new File(["<html>"], "fake.txt", { type: "text/html" }),
    ]) {
      assert.equal((await POST(request({ file }))).status, 400);
    }
    assert.match(
      sourceFileError({ name: "large.txt", type: "text/plain", size: MAX_SOURCE_BYTES + 1 }),
      /1 MB/,
    );
    assert.equal(sourceFileError({ name: "lesson.TXT", type: "", size: 100 }), "");
    const oversized = new Request("http://localhost/api/debate/upload", {
      method: "POST",
      headers: {
        Origin: "http://localhost",
        "Content-Length": String(MAX_SOURCE_BYTES + 100000),
        "Content-Type": "multipart/form-data; boundary=test",
      },
      body: "",
    });
    assert.equal((await POST(oversized)).status, 413);
    const streaming = new Request("http://localhost/api/debate/upload", {
      method: "POST",
      headers: { Origin: "http://localhost", "Content-Type": "multipart/form-data; boundary=test" },
      duplex: "half",
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(MAX_SOURCE_BYTES + 100000));
          controller.close();
        },
      }),
    });
    assert.equal((await POST(streaming)).status, 413);
    assert.equal(calls, 0);
    delete process.env.OPENAI_API_KEY;
    assert.equal((await POST(request())).status, 503);
    process.env.OPENAI_API_KEY = "test-key";
    for (const [source, file] of [
      ["txt", new File([content], "lesson.txt", { type: "text/plain" })],
      ["srt", new File([srt], "lesson.SRT", { type: "application/x-subrip" })],
    ]) {
      const stance = source === "txt" ? "agree" : "disagree";
      const response = await POST(request({ file, stance }));
      assert.equal(response.status, 200);
      const session = await response.json();
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(session.source, source);
      assert.equal(session.sourceName, file.name);
      assert.equal(session.sourceUrl, undefined);
      assert.equal(readContext(session.token).source, source);
      assert.equal(readContext(session.token).stance, stance);
      assert.equal(session.analysis.keySentences[0].english, "Small habits make a big difference.");
    }
    assert.equal(calls, 2);
    for (const file of [
      new File(["short"], "short.txt"),
      new File(["a".repeat(60001)], "long.txt"),
      new File(["bad timing"], "bad.srt"),
      new File([new Uint8Array([0xff, 0xff, 0xff])], "invalid.txt"),
    ]) {
      assert.equal((await POST(request({ file }))).status, 422);
    }
    assert.equal(calls, 2, "Invalid content must not call OpenAI");
    fail = true;
    assert.equal((await POST(request())).status, 502);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});

test("TXT and SRT support UTF-8/UTF-16 and SRT excludes cue numbers, timestamps and formatting", async () => {
  assert.equal(parseSrt(srt), content);
  assert.equal(
    parseSrt("00:00:01.000 --> 00:00:02.000\n{\\an8}<b>Hello world.</b>"),
    "Hello world.",
  );
  assert.equal(
    await readTextFile(new File([Buffer.from(`\uFEFF${content}`, "utf16le")], "lesson.txt")),
    content,
  );
  assert.equal(await readSrtFile(new File([Buffer.from(srt, "utf16le")], "lesson.srt")), content);
  assert.equal(
    await readSrtFile(new File([Buffer.from(srt, "utf16le").swap16()], "lesson.srt")),
    content,
  );
  assert.throws(() => parseSrt("1\n00:61:00,000 --> 00:62:00,000\nInvalid minutes."));
  assert.throws(() => parseSrt("1\n00:00:04,000 --> 00:00:02,000\nInvalid duration."));
  assert.throws(() => parseSrt("1\n00:00:00,000 --> 00:00:01,000\n<i></i>"));
});
