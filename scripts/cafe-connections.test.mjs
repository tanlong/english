import assert from "node:assert/strict";
import test from "node:test";
import { createTestDatabase } from "./test-database.mjs";
import { GET, PUT, POST, DELETE } from "../app/api/advanced/[[...path]]/route.ts";
import { GET as learnerIdentity } from "../app/api/learning/route.ts";
import { POST as cafePost } from "../app/api/cafe/[[...path]]/route.ts";
const admin = "test-cafe-owner-token-0000000000000000000000";
const other = "test-cafe-other-token-0000000000000000000000";
function req(path, method = "GET", body, token = admin) {
  return new Request(`http://localhost/api/advanced/${path}`, {
    method,
    headers: { Origin: "http://localhost", Authorization: `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
test("only scoped admins can configure, test, activate and remove encrypted connections", async (t) => {
  const database = await createTestDatabase();
  const original = { ...process.env };
  const env = (key, value) => {
    process.env[key] = value;
  };
  t.after(() => {
    for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
  });
  env(
    "CAFE_ADMIN_PRINCIPALS",
    JSON.stringify([
      { token: admin, tenantId: "local", role: "owner" },
      { token: other, tenantId: "other", role: "admin" },
    ]),
  );
  env("CAFE_SECRET_KEYS", JSON.stringify({ v1: Buffer.alloc(32, 7).toString("base64") }));
  env("CAFE_SECRET_KEY_VERSION", "v1");
  env("CAFE_GROQ_MODELS", "test-model");
  env("CAFE_ALLOW_LEARNER_AI", "true");
  const secret = "provider-secret-should-never-be-returned";
  try {
    assert.equal((await GET(req("connections", "GET", undefined, "learner"))).status, 403);
    const saved = await PUT(
      req("connections/groq", "PUT", {
        provider: "groq",
        model: "test-model",
        credential: secret,
        dailyRequests: 10,
        userDailyRequests: 3,
        timeoutMs: 5000,
        maxOutputTokens: 600,
      }),
    );
    assert.equal(saved.status, 200);
    assert.ok(!(await saved.text()).includes(secret));
    assert.equal((await POST(req("connections/groq/activate", "POST", {}))).status, 412);
    t.mock.method(
      globalThis,
      "fetch",
      async () => new Response("secret internal details", { status: 401 }),
    );
    const invalid = await POST(req("connections/groq/test", "POST", {}));
    assert.equal((await invalid.json()).status, "invalid");
    t.mock.method(globalThis, "fetch", async () =>
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                replyEn: "Hello! What would you like?",
                explanationVi: "Hãy gọi một món.",
                correction: null,
                hints: {
                  basic: "A coffee, please.",
                  better: "I'd like a coffee.",
                  natural: "Could I get a coffee?",
                },
                npcEmotion: "happy",
              }),
            },
          },
        ],
      }),
    );
    const healthy = await POST(req("connections/groq/test", "POST", {}));
    assert.equal((await healthy.json()).status, "healthy");
    assert.equal((await POST(req("connections/groq/activate", "POST", {}))).status, 200);
    const configs = await (await GET(req("connections"))).json();
    assert.equal(configs.connections[0].enabled, true);
    assert.ok(!JSON.stringify(configs).includes(secret));
    assert.equal(
      (await (await GET(req("connections", "GET", undefined, other))).json()).connections.length,
      0,
    );
    assert.equal((await POST(req("connections/groq/test", "POST", {}, other))).status, 404);
    assert.equal((await DELETE(req("connections/groq", "DELETE"))).status, 200);
    assert.equal((await POST(req("connections/groq/activate", "POST", {}))).status, 404);
    assert.equal(
      (await (await GET(req("usage"))).json()).usage.reduce(
        (sum, row) => sum + (row.subject === "tenant" ? row.requests : 0),
        0,
      ),
      2,
    );
  } finally {
    await database.close();
  }
});

test("AI calls require opt-in, count retries once and fall back on malformed output without inventing corrections", async (t) => {
  const database = await createTestDatabase();
  const original = { ...process.env };
  Object.assign(process.env, {
    CAFE_ADMIN_PRINCIPALS: JSON.stringify([{ token: admin, tenantId: "local", role: "owner" }]),
    CAFE_SECRET_KEYS: JSON.stringify({ v1: Buffer.alloc(32, 7).toString("base64") }),
    CAFE_SECRET_KEY_VERSION: "v1",
    CAFE_GROQ_MODELS: "test-model",
    CAFE_ALLOW_LEARNER_AI: "true",
  });
  t.after(() => {
    for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
  });
  const reply = {
    replyEn: "What do you like to read?",
    explanationVi: "Hỏi về sở thích đọc sách.",
    correction: null,
    hints: {
      basic: "I read books.",
      better: "I like reading books.",
      natural: "I'm really into books.",
    },
    npcEmotion: "curious",
    sourceMode: "scripted",
  };
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({
      choices: [{ message: { content: JSON.stringify(calls < 3 ? reply : { bad: true }) } }],
    });
  });
  try {
    await PUT(
      req("connections/groq", "PUT", {
        provider: "groq",
        model: "test-model",
        credential: "a-private-provider-credential",
        dailyRequests: 10,
        userDailyRequests: 3,
        timeoutMs: 5000,
        maxOutputTokens: 600,
      }),
    );
    await POST(req("connections/groq/test", "POST", {}));
    await POST(req("connections/groq/activate", "POST", {}));
    const cookie = (await learnerIdentity(new Request("http://localhost/api/learning"))).headers
      .get("set-cookie")
      .split(";")[0];
    const cafe = (path, body) =>
      cafePost(
        new Request(`http://localhost/api/cafe/${path}`, {
          method: "POST",
          headers: { Origin: "http://localhost", Cookie: cookie },
          body: JSON.stringify(body),
        }),
      );
    const session = await (
      await cafe("conversations", {
        npcId: "mimi_bunny",
        topicId: "hobbies",
        level: "B1",
        useAi: true,
      })
    ).json();
    assert.equal(session.mode, "ai");
    const message = { clientMessageId: "msg-1", text: "I like books." };
    const first = await (await cafe(`conversations/${session.id}/messages`, message)).json();
    assert.equal(first.reply.sourceMode, "ai");
    assert.equal(first.reply.correction, null);
    assert.deepEqual(
      await (await cafe(`conversations/${session.id}/messages`, message)).json(),
      first,
    );
    assert.equal(calls, 2);
    const fallback = await (
      await cafe(`conversations/${session.id}/messages`, {
        clientMessageId: "msg-2",
        text: "I read every evening.",
      })
    ).json();
    assert.equal(fallback.reply.sourceMode, "scripted");
    assert.ok(fallback.reply.fallbackReason);
    assert.equal(fallback.reply.correction, null);
    assert.equal(
      (await (await GET(req("usage"))).json()).usage.find((u) => u.subject === "tenant").requests,
      3,
    );
  } finally {
    await database.close();
  }
});
