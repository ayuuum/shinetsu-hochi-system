import { expect, type Page } from "@playwright/test";

export const TEST_EMAIL = "test@gmail.com";
export const TEST_PASSWORD = "test";

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(TEST_EMAIL);
  await page.getByLabel("パスワード").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "ログイン" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
  await expect(page).toHaveURL(/^(?!.*\/login).*/);
}
