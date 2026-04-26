import { test, expect } from "@playwright/test";

test("dashboard smoke", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "本日の業務状況" })).toBeVisible();
  await expect(page.getByText("本日の未対応タスク")).toBeVisible();
  await expect(page.getByRole("link", { name: /資格タスクを見る/ })).toBeVisible();
});

test("root redirects admins to dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "本日の業務状況" })).toBeVisible();
});
