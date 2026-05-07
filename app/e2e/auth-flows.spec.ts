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

test("auth callback handles recovery links with URL hash tokens", async ({ page }) => {
  const encodeBase64Url = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const mockAccessToken = [
    encodeBase64Url({ alg: "HS256", typ: "JWT" }),
    encodeBase64Url({
      aud: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600,
      sub: "00000000-0000-4000-8000-000000000001",
      email: "reset@example.com",
      role: "authenticated",
    }),
    Buffer.from("signature").toString("base64url"),
  ].join(".");

  await page.route("**/auth/v1/user", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "00000000-0000-4000-8000-000000000001",
        aud: "authenticated",
        role: "authenticated",
        email: "reset@example.com",
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      }),
    });
  });

  await page.route("**/auth/v1/token?grant_type=refresh_token", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: mockAccessToken,
        refresh_token: "mock-refresh-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: "00000000-0000-4000-8000-000000000001",
          aud: "authenticated",
          role: "authenticated",
          email: "reset@example.com",
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
        },
      }),
    });
  });

  await page.goto(`/auth/callback?next=%2Fauth%2Fupdate-password#access_token=${mockAccessToken}&refresh_token=mock-refresh-token&type=recovery&expires_in=3600&token_type=bearer`);
  await expect(page).toHaveURL(/\/auth\/update-password$/);
  await expect(page.getByText("新しいパスワードを設定", { exact: true })).toBeVisible();
});
