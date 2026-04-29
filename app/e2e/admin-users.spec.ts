import { test, expect } from "@playwright/test";

test("user invite modal explains auth email and employee link", async ({ page }) => {
  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "ユーザー管理" })).toBeVisible();

  await page.getByRole("button", { name: "招待する" }).click();
  const dialog = page.getByRole("dialog", { name: "ユーザーを招待" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("利用者はメール内のリンクからパスワードを設定")).toBeVisible();
  await expect(dialog.getByText("社員紐づけ")).toBeVisible();
});
