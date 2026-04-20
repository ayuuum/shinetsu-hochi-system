import { test, expect } from "@playwright/test";

test("create alcohol check", async ({ page }) => {
  await page.goto("/alcohol-checks");
  await page.getByRole("button", { name: "体調・アルコール記録" }).click();

  await expect(page.getByRole("heading", { name: "アルコールチェック" })).toBeVisible();

  const employeeTrigger = page.getByText("👤 対象社員", { exact: true }).locator("xpath=following::button[1]");
  await employeeTrigger.click();
  const firstEmployee = page.locator("[data-slot='select-item']").first();
  await expect(firstEmployee).toBeVisible();
  const employeeName = (await firstEmployee.textContent())?.trim() || "";
  await firstEmployee.click();

  const checkerTrigger = page.getByText("👮 安全運転管理者", { exact: true }).locator("xpath=following::button[1]");
  await checkerTrigger.click();
  const checkerOption = page.getByText(employeeName, { exact: true }).last();
  await expect(checkerOption).toBeVisible();
  await checkerOption.click();

  await page.getByLabel("メーター値（任意）").fill("0.00");
  await page.getByRole("button", { name: "記録を保存する" }).click();

  await expect(page.locator("table")).toContainText(employeeName);
});
