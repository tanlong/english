import { expect, test } from "@playwright/test";

const expectedScenes = [
  "inside_cafe",
  "outdoor_terrace",
  "mountain_view",
  "forest_path",
  "village_homes",
  "river_bridge",
  "lakeside",
  "farm_fields",
  "village_market",
  "work_lounge",
  "project_room",
  "design_studio",
  "coffee_house",
  "hobby_library",
  "it_team_room",
  "banking_office",
  "development_lab",
  "qa_operations",
];

for (const width of [390, 1440]) {
  test(`18 topics have three usable NPC roles and signposted routes at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
    await page.goto("/english/cafe");
    const config = await (await page.request.get("/api/cafe/scenes")).json();
    const scenes = config.scenes as {
      id: string;
      topicId?: string;
      label: string;
      exits: { to: string; label: string; direction: string }[];
      npcs: { id: string }[];
    }[];
    const frame = page.locator(".cafe-scene-frame");
    let current = "inside_cafe";
    const checked = new Set<string>();

    async function walkTo(destination: string) {
      const queue: { id: string; route: { to: string; label: string; direction: string }[] }[] = [
        { id: current, route: [] },
      ];
      const visited = new Set<string>();
      while (queue.length) {
        const node = queue.shift()!;
        if (node.id === destination) {
          for (const exit of node.route) {
            await page.getByRole("button", { name: exit.label, exact: true }).click();
            await expect(frame).toHaveAttribute("data-scene", exit.to);
            current = exit.to;
          }
          return;
        }
        if (visited.has(node.id)) continue;
        visited.add(node.id);
        for (const exit of scenes.find((scene) => scene.id === node.id)!.exits)
          queue.push({ id: exit.to, route: [...node.route, exit] });
      }
      throw new Error(`No playable route to ${destination}`);
    }

    for (const sceneId of expectedScenes) {
      await walkTo(sceneId);
      const scene = scenes.find((item) => item.id === sceneId)!;
      await expect(frame).toHaveAttribute("data-topic", scene.topicId!);
      await expect(frame.locator(".cafe-hotspot")).toHaveCount(3);
      if (sceneId === "development_lab") {
        await expect(
          page.getByRole("button", { name: "Trò chuyện với Developer Sloth", exact: true }),
        ).toBeVisible();
        await expect(frame.locator('[data-npc-id="dex_robot"] img')).toHaveAttribute(
          "src",
          /developer-sloth\.webp/,
        );
      }
      if (sceneId === "qa_operations")
        await expect(
          page.getByRole("button", { name: "Trò chuyện với Tester Turtle", exact: true }),
        ).toBeVisible();
      const bounds = (await frame.boundingBox())!;
      for (const role of ["guide", "conversation", "hybrid"]) {
        const hotspot = frame.locator(`[data-npc-role="${role}"]`);
        await expect(hotspot).toBeEnabled();
        await expect(hotspot.locator(".cafe-npc-role")).toBeVisible();
        await hotspot.focus();
        await expect(hotspot).toBeFocused();
        const label = await hotspot.getAttribute("aria-label");
        const name = label!.replace(/^(Học cùng |Trò chuyện với |Luyện kết hợp với )/, "");
        await hotspot.press("Enter");
        const dialog = page.getByRole("dialog");
        await expect(dialog.getByRole("heading", { name, exact: true })).toBeVisible();
        const roleLabel =
          role === "guide" ? "Hướng dẫn" : role === "hybrid" ? "Kết hợp" : "Giao tiếp";
        await expect(dialog.getByText(new RegExp(`^${roleLabel} ·`))).toBeVisible();
        await expect(
          dialog.getByRole("button", {
            name:
              role === "guide"
                ? "Bắt đầu học"
                : role === "hybrid"
                  ? "Bắt đầu luyện có hướng dẫn"
                  : "Bắt đầu trò chuyện",
            exact: true,
          }),
        ).toBeVisible();
        await dialog.getByRole("button", { name: "Đóng trò chuyện", exact: true }).click();
        await expect(hotspot).toBeFocused();
        checked.add(name);
      }
      for (const actor of await frame.locator(".cafe-scene-person").all()) {
        const box = (await actor.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(bounds.x);
        expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
        expect(box.y).toBeGreaterThanOrEqual(bounds.y);
        expect(box.y + box.height).toBeLessThanOrEqual(bounds.y + bounds.height + 1);
      }
      for (const image of await frame.locator("img").all())
        await expect
          .poll(() => image.evaluate((img) => (img as HTMLImageElement).naturalWidth))
          .toBeGreaterThan(0);
      await expect(page.getByText("Chưa tải đủ khung cảnh", { exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      if (
        ["inside_cafe", "coffee_house", "farm_fields", "development_lab", "qa_operations"].includes(
          sceneId,
        )
      )
        await page
          .locator(".cafe-scene-card")
          .screenshot({ path: test.info().outputPath(`${sceneId}.png`) });
    }
    expect(checked.size).toBe(54);
    await walkTo("map");
    await expect(frame.locator(".cafe-map-point")).toHaveCount(9);
    await page.getByRole("button", { name: "Học cùng Learning Bird", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Learning Bird", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Đóng hướng dẫn", exact: true }).click();
    expect(errors).toEqual([]);
  });
}
