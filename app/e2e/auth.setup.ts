import { test as setup, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

setup("admin login state", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByRole("heading", { name: "今日の業務状況を先に把握する" })).toBeVisible();
  await page.context().storageState({ path: ".auth/admin.json" });
});
