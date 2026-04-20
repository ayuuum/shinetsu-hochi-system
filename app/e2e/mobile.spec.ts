import { test, expect } from "@playwright/test";

test("mobile dashboard shows bottom nav", async ({ page }) => {
  await page.goto("/");
  const bottomNav = page.locator("nav").last();

  await expect(page.getByRole("heading", { name: "本日の優先対応" }).first()).toBeVisible();
  await expect(bottomNav.getByRole("link", { name: "ホーム", exact: true })).toBeVisible();
  await expect(bottomNav.getByRole("link", { name: "社員", exact: true })).toBeVisible();
  await expect(bottomNav.getByRole("link", { name: "施工", exact: true })).toBeVisible();
  await expect(bottomNav.getByRole("button", { name: "メニュー", exact: true })).toBeVisible();
});
