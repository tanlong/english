import assert from "node:assert/strict";
import test from "node:test";
import { createTestDatabase } from "./test-database.mjs";
import { GET, POST } from "../app/api/content-admin/route.ts";
import { GET as learnerList } from "../app/api/v1/lessons/route.ts";
import { GET as learnerLesson } from "../app/api/v1/lessons/[slug]/route.ts";
import { authoredText } from "../app/content/governance.ts";
import { baselineLesson } from "../app/content/baseline.ts";

const keys = {
  editor: "TEST-EDITOR-".padEnd(40, "e"),
  reviewer: "TEST-REVIEWER-".padEnd(40, "r"),
  admin: "TEST-ADMIN-".padEnd(40, "a"),
};
function request(role, body) {
  return new Request("http://localhost/api/content-admin", {
    method: body ? "POST" : "GET",
    headers: {
      Origin: "http://localhost",
      Authorization: `Bearer ${keys[role] ?? "invalid"}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
test("editorial API enforces role, 95/5 gates, audio revision, draft privacy and rollback", async () => {
  const fixture = await createTestDatabase();
  process.env.CONTENT_EDITOR_TOKEN = keys.editor;
  process.env.CONTENT_REVIEWER_TOKEN = keys.reviewer;
  process.env.CONTENT_ADMIN_TOKEN = keys.admin;
  const id = baselineLesson.slug;
  const submit = async (role, action, revision, extra = {}) =>
    POST(request(role, { id, action, revision, ...extra }));
  try {
    assert.equal((await GET(request("unknown"))).status, 403);
    assert.equal((await submit("admin", "seed")).status, 403);
    assert.equal((await submit("editor", "seed")).status, 200);
    assert.equal(
      (
        await learnerLesson(new Request(`http://localhost/api/v1/lessons/${id}`), {
          params: Promise.resolve({ slug: id }),
        })
      ).status,
      404,
    );
    let state = await (await GET(request("editor"))).json();
    const draft = state.documents.find((d) => d.id === id).draft;
    assert.equal((await submit("editor", "approve", 1)).status, 403);
    assert.equal((await submit("editor", "submit", 1)).status, 200);
    assert.equal((await submit("reviewer", "approve", 1)).status, 422);
    assert.equal((await submit("admin", "publish", 1)).status, 409);

    // Synthetic test-only lexicon: never written to the app's real database.
    const words = new Set(
      authoredText(baselineLesson)
        .toLowerCase()
        .match(/[a-z]+(?:'[a-z]+)*/g),
    );
    let i = 0;
    const letters = (n) =>
      n < 26 ? String.fromCharCode(97 + n) : letters(Math.floor(n / 26) - 1) + letters(n % 26);
    while (words.size < 1500) words.add(`fixture${letters(i++)}`);
    const lexicon = {
      version: "TEST-ONLY-SYNTHETIC",
      approvedBy: "TEST FIXTURE",
      entries: [...words].map((lemma) => ({
        lemma,
        forms: [],
        meaningVi: "Test only",
        source: "https://example.test/fixture",
      })),
    };
    assert.equal((await submit("reviewer", "lexicon", 1, { lexicon })).status, 200);
    draft.ipaReviewed = true;
    draft.assetRights = true;
    draft.assetAlt = "Test scene.";
    draft.evidence = {
      cambridge: "https://dictionary.cambridge.org/us/dictionary/english/get-up",
      coca: "https://www.english-corpora.org/coca/",
      youglish: "https://youglish.com/pronounce/get/english/us",
    };
    assert.equal((await submit("editor", "save", 1, { draft })).status, 200);
    assert.equal((await submit("admin", "publish", 1)).status, 409);
    assert.equal((await submit("editor", "submit", 2)).status, 200);
    assert.equal((await submit("reviewer", "approve", 2)).status, 200);
    assert.equal((await submit("admin", "publish", 2)).status, 422);
    const audio = Object.fromEntries(
      draft.lesson.segments.flatMap((segment) =>
        ["basic", "better", "natural"].map((level) => [
          `${segment.id}:${level}`,
          { url: "https://example.test/audio.mp3", text: segment[level].en, revision: 2 },
        ]),
      ),
    );
    const badAudio = structuredClone(audio);
    badAudio[Object.keys(badAudio)[0]].text = "A stale sentence.";
    assert.equal((await submit("reviewer", "audio", 2, { audio: badAudio })).status, 422);
    assert.equal((await submit("reviewer", "audio", 2, { audio })).status, 200);
    assert.equal((await submit("admin", "publish", 2)).status, 200);
    assert.equal((await (await learnerList()).json()).lessons.length, 1);
    state = await (await GET(request("admin"))).json();
    const published = state.audit.find((entry) => entry.action === "publish");
    assert.equal((await submit("editor", "save", 2, { draft })).status, 200);
    assert.equal((await (await learnerList()).json()).lessons[0].lesson.revision, 2);
    assert.equal((await submit("admin", "publish", 3)).status, 409);
    assert.equal((await submit("admin", "rollback", 3, { auditId: published.id })).status, 200);
    assert.equal((await submit("admin", "unpublish", 3)).status, 200);
    assert.equal((await (await learnerList()).json()).lessons.length, 0);
  } finally {
    await fixture.close();
    delete process.env.CONTENT_EDITOR_TOKEN;
    delete process.env.CONTENT_REVIEWER_TOKEN;
    delete process.env.CONTENT_ADMIN_TOKEN;
  }
});
