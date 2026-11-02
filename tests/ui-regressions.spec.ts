import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "natural-english:v2",
      JSON.stringify({
        version: 2,
        profile: {
          name: "Long",
          role: "general",
          goal: "both",
          confidence: "some",
          largeText: false,
          mic: false,
        },
        activeWeek: 1,
        activeDay: 1,
        sessions: {},
        dailySeconds: {},
      }),
    );
  });
});

test("search controls have one border around the icon and input", async ({ page }) => {
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const path = "/ipa";
    await page.goto(path);
    const search = page.getByRole("textbox", {
      name: "Tìm âm IPA",
    });
    await expect(search).toBeVisible();
    const styles = await search.evaluate((element) => {
      const input = getComputedStyle(element);
      const group = getComputedStyle(element.parentElement!);
      return { inputBorder: input.borderTopWidth, groupBorder: group.borderTopWidth };
    });
    expect(styles.groupBorder).toBe("1px");
    expect(
      styles.inputBorder,
      `${path}: the input must not draw a second border inside the search group`,
    ).toBe("0px");
    await search.locator("..").locator("svg").click();
    await expect(search).toBeFocused();
    const focus = await search.evaluate((element) => ({
      inputBorder: getComputedStyle(element).borderTopWidth,
      groupShadow: getComputedStyle(element.parentElement!).boxShadow,
    }));
    expect(focus.inputBorder).toBe("0px");
    expect(focus.groupShadow).not.toBe("none");
    await page.screenshot({ path: `artifacts/ui-audit/fixed-${width}-${path.slice(1)}.png` });
  }
});

test("keyboard focus stays above the mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/settings");
  const largeText = page.getByRole("checkbox", { name: "Chữ lớn, dễ đọc hơn" });
  await largeText.focus();
  await largeText.evaluate((el) => el.scrollIntoView({ block: "end" }));
  await page.keyboard.press("Tab");
  const save = page.getByRole("button", { name: "Lưu thay đổi", exact: true });
  await expect(save).toBeFocused();
  const bounds = (await save.boundingBox())!;
  const nav = (await page.locator(".mobile-nav").boundingBox())!;
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(nav.y);
});

test("combobox popups have no blank band and stay inside small viewports", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 812, height: 375 },
    { width: 375, height: 260 },
  ]) {
    await page.setViewportSize(viewport);
    for (const path of ["/settings", "/daily-speaking"]) {
      await page.goto(path);
      await page.locator(".main-content").waitFor();
      if (path === "/daily-speaking")
        await page.getByRole("button", { name: "Mở thiết lập", exact: true }).click();
      const triggers = page.getByRole("button", { name: /Mở danh sách/ });
      expect(await triggers.count()).toBeGreaterThan(0);
      for (const trigger of await triggers.all()) {
        if (await trigger.isDisabled()) continue;
        await trigger.click();
        const popup = page.locator(".app-combobox-popup");
        await expect(popup).toBeVisible();
        const empty = popup.locator('[data-slot="combobox-empty"]');
        const height = await empty.evaluate((el) => el.getBoundingClientRect().height);
        expect.soft(height, "the live region must take no space when there are options").toBe(0);
        await expect
          .poll(async () => {
            const bounds = (await popup.boundingBox())!;
            return (
              bounds.y >= 0 &&
              bounds.y + bounds.height <= viewport.height &&
              bounds.x >= 0 &&
              bounds.x + bounds.width <= viewport.width
            );
          })
          .toBe(true);
        const lastOption = popup.getByRole("option").last();
        await lastOption.scrollIntoViewIfNeeded();
        const optionBounds = (await lastOption.boundingBox())!;
        const popupBounds = (await popup.boundingBox())!;
        expect(optionBounds.y).toBeGreaterThanOrEqual(popupBounds.y);
        expect(optionBounds.y + optionBounds.height).toBeLessThanOrEqual(
          popupBounds.y + popupBounds.height,
        );
        if (viewport.width === 320 && path === "/daily-speaking") {
          await page.screenshot({ path: "artifacts/ui-audit/fixed-combobox-mobile.png" });
        }
        await page.keyboard.press("Escape");
      }
    }
  }
  const topic = page.getByRole("combobox", { name: "Chủ đề", exact: true });
  await topic.fill("không có chủ đề này");
  await expect(
    page.getByRole("status").filter({ hasText: "Không tìm thấy lựa chọn." }),
  ).toBeVisible();
});
