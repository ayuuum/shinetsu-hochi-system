import { test as setup, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

setup("admin login state", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "本日の業務状況" })).toBeVisible();
  await page.context().storageState({ path: ".auth/admin.json" });
});
