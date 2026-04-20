import { test as setup, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

setup("admin login state", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByText("本日の優先対応")).toBeVisible();
  await page.context().storageState({ path: ".auth/admin.json" });
});
