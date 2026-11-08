import { expect, test } from "@playwright/test";

test("field zoom shows the complete landscape before entering the rice paddies", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
  await page.goto("/english/cafe");
  for (const name of ["Đến đồi chè", "Đến hồ thông", "Đến làng Bình Nguyên"])
    await page.getByRole("button", { name, exact: true }).click();
  await page.clock.install({ time: new Date("2026-11-08T08:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-08T08:00:01Z"));
  await page.getByRole("button", { name: "Khám phá Cánh đồng", exact: true }).click();
  const preview = page.locator(".cafe-flight-ground img");
  await expect(preview).not.toHaveAttribute("src", /\/sky\.webp$/);
  await expect
    .poll(() => preview.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBe(1672);
  await page.clock.runFor(1100);
  await page.locator(".cafe-map-flight").evaluate((element) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      animation.pause();
      animation.currentTime = 1100;
    }
  });
  await page.addStyleTag({ content: "nextjs-portal { display:none!important; }" });
  await page
    .locator(".cafe-scene-frame")
    .screenshot({ path: test.info().outputPath("field-arrival.png"), animations: "allow" });
  await page.clock.runFor(200);
  await expect(page.locator(".cafe-scene-frame")).toHaveAttribute("data-scene", "farm_fields");
});

for (const reduced of [false, true]) {
  test(`map zoom enters the selected point and reverses safely${reduced ? " with reduced motion" : ""}`, async ({
    page,
  }) => {
    if (reduced) await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("button", { name: "Bắt đầu nhanh, thiết lập sau" }).click();
    await page.goto("/english/cafe");
    for (const name of ["Đến đồi chè", "Đến hồ thông", "Đến làng Bình Nguyên"])
      await page.getByRole("button", { name, exact: true }).click();
    const frame = page.locator(".cafe-scene-frame");
    await expect(frame).toHaveAttribute("data-scene", "map");
    await page.clock.install();
    const point = page.getByRole("button", { name: "Khám phá Vườn cây ăn trái", exact: true });
    const flight = frame.locator(".cafe-map-flight");
    await point.click();
    if (reduced) await expect(flight).toHaveCount(0);
    else {
      await expect(flight).toHaveAttribute("data-direction", "in");
      await expect(point).toBeDisabled();
      await expect(flight.locator(".cafe-flight-map")).toHaveCSS(
        "animation-name",
        "cafe-map-descend",
      );
    }
    await page.clock.runFor(1300);
    await expect(frame).toHaveAttribute("data-scene", "forest_path");
    await expect(flight).toHaveCount(0);
    await page.getByRole("button", { name: "Về Bình Nguyên", exact: true }).click();
    if (reduced) await expect(flight).toHaveCount(0);
    else {
      await expect(flight).toHaveAttribute("data-direction", "out");
      await expect(flight.locator(".cafe-flight-map")).toHaveCSS(
        "animation-name",
        "cafe-map-ascend",
      );
    }
    await page.clock.runFor(1300);
    await expect(frame).toHaveAttribute("data-scene", "map");
    await expect(point).toBeFocused();
    await expect(flight).toHaveCount(0);
  });
}
