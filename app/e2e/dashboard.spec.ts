import { test, expect } from "@playwright/test";

test("dashboard smoke", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("本日の優先対応")).toBeVisible();
  await expect(page.getByText("本日の未対応タスク")).toBeVisible();
  await expect(page.getByRole("link", { name: /資格タスクを見る/ })).toBeVisible();
});
