import { test, expect } from "@playwright/test";
import { chooseSelectOption, uniqueSuffix } from "./helpers/form";

test("create employee", async ({ page }) => {
  const suffix = uniqueSuffix();
  const employeeNumber = `E2E-${suffix}`;
  const employeeName = `E2E 社員 ${suffix}`;

  await page.goto("/employees");
  await page.getByRole("button", { name: "社員登録" }).click();

  await expect(page.getByRole("heading", { name: "新規社員登録" })).toBeVisible();

  await page.getByLabel("社員番号 *").fill(employeeNumber);
  await page.getByLabel("氏名 *").fill(employeeName);
  await page.getByLabel("フリガナ *").fill(`イーツーイー シャイン ${suffix}`);
  await page.getByLabel("生年月日 *").fill("1990-04-01");
  await page.getByLabel("入社日 *").fill("2026-04-19");

  await chooseSelectOption(
    page,
    page.getByText("拠点 *", { exact: true }).locator("xpath=following::button[1]"),
    "本社",
  );

  await page.getByRole("button", { name: "保存して閉じる" }).click();

  await expect(page.getByRole("link", { name: employeeName })).toBeVisible();
  await expect(page.getByRole("link", { name: employeeNumber })).toBeVisible();
});
