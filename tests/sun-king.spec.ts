import { expect, test } from "@playwright/test";

for (const width of [390, 1440, 3290]) {
  test(`Sun King laughs in separate layers while the wet mound stays grounded at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
    await page.goto("/english/cafe");
    for (const name of [
      "Đến đồi chè",
      "Đến hồ thông",
      "Đến làng Bình Nguyên",
      "Khám phá Cánh đồng",
    ])
      await page.getByRole("button", { name, exact: true }).click();
    const actor = page.locator('.cafe-scene-person [data-npc-id="sun_king"]');
    await expect(actor).toHaveAttribute("data-renderer", "layers");
    const head = actor.locator('[data-layer="head"]');
    const ground = page.locator(".cafe-scene-frame .layer-field-land img");
    await expect(actor.locator('[data-layer="ground"]')).toHaveCount(0);
    await expect(head).toBeVisible();
    await expect(actor.locator('[data-layer="body"]')).toBeVisible();
    await expect(ground).toBeVisible();
    const restingGround = await ground.boundingBox();
    const initial = await head.evaluate((el) => getComputedStyle(el).transform);
    await expect
      .poll(() => head.evaluate((el) => getComputedStyle(el).transform))
      .not.toBe(initial);
    expect(await ground.boundingBox()).toEqual(restingGround);
    const sun = page.getByRole("button", { name: "Trò chuyện với Sun King", exact: true });
    await page.keyboard.press("Tab");
    await sun.focus();
    await expect(page.getByRole("tooltip")).toContainText("Ki ki ki!");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Tạm dừng chuyển động", exact: true }).click();
    await expect(head).toHaveCSS("animation-play-state", "paused");
    const frozen = await head.evaluate((el) => getComputedStyle(el).transform);
    await page.waitForTimeout(250);
    expect(await head.evaluate((el) => getComputedStyle(el).transform)).toBe(frozen);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(head).toHaveCSS("animation-name", "none");
    await page.addStyleTag({ content: "nextjs-portal { display:none!important; }" });
    await page
      .locator(".cafe-scene-frame")
      .screenshot({ path: test.info().outputPath("sun-king-field.png") });
    await sun.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Sun King", exact: true })).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Nghe Sun King cười", exact: true }),
    ).toBeVisible();
    await dialog.screenshot({ path: test.info().outputPath("sun-king-dialog.png") });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test("Sun King's complete poster remains usable when an extracted layer fails", async ({
  page,
}) => {
  await page.route("**/cafe/npc/sun_king/field-v2/head-*.webp", (route) => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.goto("/english/cafe");
  for (const name of ["Đến đồi chè", "Đến hồ thông", "Đến làng Bình Nguyên", "Khám phá Cánh đồng"])
    await page.getByRole("button", { name, exact: true }).click();
  const actor = page.locator('.cafe-scene-person [data-npc-id="sun_king"]');
  await expect(actor).toHaveAttribute("data-renderer", "poster");
  const poster = actor.locator(".sun-king-poster");
  await expect(poster).toBeVisible();
  await expect
    .poll(() => poster.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await expect(actor.locator(".sun-king-parts")).toBeHidden();
  await page.getByRole("button", { name: "Trò chuyện với Sun King", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Nghe Sun King cười", exact: true }),
  ).toBeVisible();
});
