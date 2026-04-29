import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("manual is public", async ({ page }) => {
  await page.goto("/manual");
  await expect(page.getByRole("heading", { name: /操作マニュアル/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "パスワードを忘れた場合" })).toBeVisible();
});

test("login failure is shown in Japanese", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill("missing@example.com");
  await page.getByLabel("パスワード").fill("wrong-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByText(/メールアドレスまたはパスワード/)).toBeVisible({ timeout: 15_000 });
});

test("password update validates short and mismatched passwords", async ({ page }) => {
  await page.goto("/auth/update-password");
  await page.getByLabel("新しいパスワード", { exact: true }).fill("short");
  await page.getByLabel("新しいパスワード（確認）").fill("short");
  await page.getByRole("button", { name: "パスワードを更新" }).click();
  await expect(page.getByText("パスワードは8文字以上にしてください。")).toBeVisible();

  await page.getByLabel("新しいパスワード", { exact: true }).fill("long-password-1");
  await page.getByLabel("新しいパスワード（確認）").fill("long-password-2");
  await page.getByRole("button", { name: "パスワードを更新" }).click();
  await expect(page.getByText("パスワードが一致しません。")).toBeVisible();
});
