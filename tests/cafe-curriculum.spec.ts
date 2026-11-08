import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`all 18 selected NPCs open their topic in the appropriate setting at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
    await page.goto("/english/cafe");
    await page.addStyleTag({ content: "nextjs-portal { display:none!important; }" });
    const checked = new Set<string>();
    const frame = page.locator(".cafe-scene-frame");
    async function check(entries: [string, string][]) {
      await expect(page.getByRole("button", { name: `Trò chuyện với ${entries[0][0]}`, exact: true })).toBeEnabled();
      const sceneBox = (await frame.boundingBox())!;
      for (const actor of await frame.locator(".cafe-scene-person").all()) {
        const box = (await actor.boundingBox())!;
        expect(box.width / sceneBox.width, "NPCs remain readable within the scene").toBeGreaterThanOrEqual(0.15);
        expect(box.x).toBeGreaterThanOrEqual(sceneBox.x);
        expect(box.x + box.width).toBeLessThanOrEqual(sceneBox.x + sceneBox.width);
        expect(box.y).toBeGreaterThanOrEqual(sceneBox.y);
        expect(box.y + box.height).toBeLessThanOrEqual(sceneBox.y + sceneBox.height + 1);
      }
      await frame.screenshot({ path: test.info().outputPath(`${await frame.getAttribute("data-scene")}.png`) });
      for (const [name, topic] of entries) {
        const npc = page.getByRole("button", { name: `Trò chuyện với ${name}`, exact: true });
        if (width === 1440) {
          await page.mouse.move(0, 0);
          await npc.hover();
        } else {
          await page.keyboard.press("Tab");
          await npc.focus();
        }
        const bubble = page.getByRole("tooltip");
        await expect(bubble.getByText(`Chủ đề: ${topic}`, { exact: true })).toBeVisible();
        const bubbleBox = (await bubble.boundingBox())!;
        const frameBox = (await frame.boundingBox())!;
        expect(bubbleBox.x).toBeGreaterThanOrEqual(frameBox.x);
        expect(bubbleBox.x + bubbleBox.width).toBeLessThanOrEqual(frameBox.x + frameBox.width);
        expect(bubbleBox.y).toBeGreaterThanOrEqual(frameBox.y);
        expect(bubbleBox.y + bubbleBox.height).toBeLessThanOrEqual(frameBox.y + frameBox.height);
        if (name === "Tess Turtle") {
          await frame.screenshot({ path: test.info().outputPath("npc-topic-bubble.png") });
          await page.keyboard.press("Escape");
          await expect(bubble).toHaveCount(0);
        }
        await npc.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog.getByRole("heading", { name, exact: true })).toBeVisible();
        await expect(dialog.getByRole("combobox", { name: "Chủ đề", exact: true })).toHaveValue(
          topic,
        );
        const vocabulary = dialog.getByRole("region", {
          name: "5 từ trước khi trò chuyện",
          exact: true,
        });
        await expect(vocabulary.getByRole("listitem")).toHaveCount(5);
        await expect(vocabulary.getByRole("button", { name: /Nghe từ và câu:/ })).toHaveCount(5);
        await expect(dialog.getByRole("button", { name: "Bắt đầu trò chuyện", exact: true })).toBeDisabled();
        await dialog.getByRole("button", { name: "Đóng trò chuyện", exact: true }).click();
        await expect(dialog).toHaveCount(0);
        await expect(npc).toBeFocused();
        checked.add(name);
      }
      await expect(page.getByText("Chưa tải đủ khung cảnh", { exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
    await check([
      ["Cloud Cat", "Food, Coffee & Restaurants"],
      ["Ollie Owl", "My Daily Routine"],
      ["Mimi Bunny", "Hobbies & Free Time"],
    ]);
    await page.getByRole("button", { name: "Đến đồi chè", exact: true }).click();
    await check([
      ["Astro Bean", "Making Plans & Solving Problems"],
      ["Đèo Explorer", "Travel & Hotels"],
    ]);
    await page.getByRole("button", { name: "Đến hồ thông", exact: true }).click();
    await check([["Gray Boo", "Health & Feelings"]]);
    await page.getByRole("button", { name: "Đến làng Bình Nguyên", exact: true }).click();
    for (const [place, name, topic] of [
      ["Rừng thông", "Luna Deer", "Family & Friends"],
      ["Cầu qua sông", "Rio Fox", "Transportation & Directions"],
      ["Bờ hồ", "Nina Cat", "Greetings & Small Talk"],
    ]) {
      await page.getByRole("button", { name: `Khám phá ${place}`, exact: true }).click();
      await check([[name, topic]]);
      await page.getByRole("button", { name: "Về Bình Nguyên", exact: true }).click();
    }
    await page.getByRole("button", { name: "Khám phá Khu nhà", exact: true }).click();
    await check([["Ben Bear", "Introducing Yourself"]]);
    const rooms: [string, [string, string][]][] = [
      ["Cửa hàng Bình Nguyên", [["Penny Panda", "Shopping & Payments"]]],
      [
        "Góc làm việc",
        [
          ["Toby Corgi", "At Work"],
          ["Alex Otter", "IT Workplace Communication"],
        ],
      ],
      [
        "Phòng dự án",
        [
          ["Morgan Wolf", "Project Management & Meetings"],
          ["Bailey Beaver", "Business Analysis & Banking Operations"],
        ],
      ],
      [
        "Studio sản phẩm",
        [
          ["Ivy Cat", "UI/UX Design & User Experience"],
          ["Dex Robot", "Software Development & System Integration"],
          ["Tess Turtle", "Testing, Deployment & Production Support"],
        ],
      ],
    ];
    for (const [room, entries] of rooms) {
      await page
        .getByRole("navigation", { name: "Địa điểm trong khu nhà", exact: true })
        .getByRole("button", { name: room, exact: true })
        .click();
      await expect(
        page.getByRole("img", { name: `Khung cảnh ${room}`, exact: true }),
      ).toBeVisible();
      const portraits = frame.locator(".cafe-npc-image");
      await expect(portraits).toHaveCount(entries.length);
      for (const portrait of await portraits.all())
        await expect
          .poll(() => portrait.evaluate((img) => (img as HTMLImageElement).naturalHeight))
          .toBeGreaterThan(0);
      await frame.screenshot({ path: test.info().outputPath(`${room}.png`) });
      await check(entries);
      await page.getByRole("button", { name: "Về khu nhà", exact: true }).click();
    }
    expect(checked.size).toBe(18);
    expect(errors).toEqual([]);
  });
}
