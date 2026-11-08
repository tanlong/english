import assert from "node:assert/strict";
import test from "node:test";
import { createTestDatabase } from "./test-database.mjs";
import { GET as identity } from "../app/api/learning/route.ts";
import { GET, POST, DELETE } from "../app/api/cafe/[[...path]]/route.ts";

function request(path, body, cookie, method = body ? "POST" : "GET") {
  return new Request(`http://localhost/api/cafe/${path}`, {
    method,
    headers: { Origin: "http://localhost", ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test("NPC names lead with their topic and Sloths IT represents the developer", async () => {
  const prefixes = {
    greetings: "Greeting",
    introductions: "Introduction",
    daily_life: "Routine",
    family_friends: "Family",
    ordering: "Barista",
    shopping: "Shopping",
    directions: "Navigator",
    work: "Office",
    hobbies: "Hobby",
    travel: "Travel",
    health_feelings: "Wellness",
    plans: "Planner",
    it_workplace: "IT",
    project_management: "Project",
    business_analysis: "Analyst",
    ux_design: "Designer",
    software_development: "Developer",
    testing_support: "Tester",
  };
  const config = await (await GET(request("scenes"))).json();
  for (const scene of config.scenes.filter((scene) => scene.id !== "map")) {
    for (const placement of scene.npcs) {
      const npc = await (await GET(request(`npcs/${placement.id}`))).json();
      assert.ok(npc.name.startsWith(`${prefixes[npc.topics[0]]} `), npc.name);
      assert.ok(npc.name.toLowerCase().endsWith(npc.kind.replaceAll("_", " ")), npc.name);
      if (npc.id === "dex_robot") {
        assert.equal(npc.name, "Developer Sloth");
        assert.equal(npc.kind, "sloth");
        assert.equal(npc.sceneId, "development_lab");
      }
      if (npc.id === "tess_turtle") assert.equal(npc.name, "Tester Turtle");
    }
  }
  assert.equal((await (await GET(request("npcs/may"))).json()).name, "Barista Cat");
});

test("every learning scene exposes one topic and three distinct NPC roles, all reachable through exits", async () => {
  const config = await (await GET(request("scenes"))).json();
  const learning = config.scenes.filter((scene) => scene.id !== "map");
  assert.equal(learning.length, 18);
  const reached = new Set();
  const pending = ["inside_cafe"];
  while (pending.length) {
    const id = pending.pop();
    if (reached.has(id)) continue;
    reached.add(id);
    const scene = config.scenes.find((scene) => scene.id === id);
    assert.ok(scene, `exit destination ${id} exists`);
    pending.push(...scene.exits.map((exit) => exit.to));
  }
  assert.equal(reached.size, 19);
  const topics = new Set();
  const actors = new Set();
  for (const scene of learning) {
    assert.equal(scene.npcs.length, 3, scene.label);
    const roles = [];
    const sceneTopics = new Set();
    for (const placement of scene.npcs) {
      const response = await GET(request(`npcs/${placement.id}`));
      assert.equal(response.status, 200);
      const npc = await response.json();
      assert.equal(npc.sceneId, scene.id);
      assert.equal(npc.topics.length, 1);
      sceneTopics.add(npc.topics[0]);
      roles.push(npc.role);
      assert.ok(!actors.has(npc.id), `${npc.name} has one scene placement`);
      actors.add(npc.id);
    }
    assert.equal(sceneTopics.size, 1);
    assert.deepEqual(roles.sort(), ["conversation", "guide", "hybrid"]);
    topics.add([...sceneTopics][0]);
  }
  assert.equal(topics.size, 18);
  assert.equal(actors.size, 54);
});

test("new NPC sessions keep their topic and role through teaching, practice and resume", async () => {
  const database = await createTestDatabase();
  try {
    const cookie = (await identity(request(""))).headers.get("set-cookie").split(";")[0];
    for (const [npcId, role, topicId, replyPattern] of [
      ["sage_red_panda", "guide", "greetings", /Try this pattern:/],
      ["pip_penguin", "hybrid", "greetings", /If you need a starting point/],
      ["sun_king", "hybrid", "plans", /If you need a starting point/],
    ]) {
      const invalid = await POST(
        request("conversations", { npcId, topicId: "shopping", level: "A1" }, cookie),
      );
      assert.equal(invalid.status, 400, "a character cannot teach another topic");
      const response = await POST(
        request("conversations", { npcId, topicId, level: "A1", useAi: false }, cookie),
      );
      assert.equal(response.status, 201);
      const session = await response.json();
      assert.equal(session.npcId, npcId);
      assert.equal(session.role, role);
      const originalKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = "";
      try {
        const speech = await POST(
          request(`conversations/${session.id}/speech`, { text: session.greeting }, cookie),
        );
        assert.ok(
          [200, 503].includes(speech.status),
          "the NPC's own greeting is allowed for on-demand speech",
        );
      } finally {
        if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalKey;
      }
      const turn = await (
        await POST(
          request(
            `conversations/${session.id}/messages`,
            {
              clientMessageId: `${npcId}-one`,
              text: "I would like to practise.",
            },
            cookie,
          ),
        )
      ).json();
      assert.match(turn.reply.replyEn, replyPattern);
      assert.equal(turn.reply.correction, null, "scripted help never invents a correction");
      const resumed = await (
        await GET(request(`conversations/${session.id}`, undefined, cookie))
      ).json();
      assert.equal(resumed.role, role);
      assert.equal(resumed.topicId, topicId);
      assert.equal(
        (await DELETE(request(`conversations/${session.id}`, undefined, cookie, "DELETE"))).status,
        200,
      );
    }
  } finally {
    await database.close();
  }
});
