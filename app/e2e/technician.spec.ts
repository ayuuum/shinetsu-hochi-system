import { test, expect } from "@playwright/test";

const technicianEmail = process.env.E2E_TECHNICIAN_EMAIL;
const technicianPassword = process.env.E2E_TECHNICIAN_PASSWORD;

test("admin is redirected away from technician-only entry", async ({ page }) => {
  await page.goto("/today");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "本日の業務状況" })).toBeVisible();
});

test("technician lands on today when credentials are provided", async ({ browser, baseURL }) => {
  test.skip(!technicianEmail || !technicianPassword, "Set E2E_TECHNICIAN_EMAIL and E2E_TECHNICIAN_PASSWORD to run technician login smoke.");

  const context = await browser.newContext({ baseURL: baseURL ?? "http://127.0.0.1:3006" });
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(technicianEmail!);
  await page.getByLabel("パスワード").fill(technicianPassword!);
  await page.getByRole("button", { name: "ログイン" }).click();
  await page.waitForURL(/\/today$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /今日/ })).toBeVisible();
  await context.close();
});
