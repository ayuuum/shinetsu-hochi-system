import { expect, test } from "@playwright/test";

test("employee CSV import preview shows validation errors without importing", async ({ page }) => {
  await page.goto("/import");

  await expect(page.getByRole("heading", { name: "データインポート" })).toBeVisible();
  await expect(page.getByRole("button", { name: "テンプレートCSV" }).first()).toBeVisible();
  await expect(page.getByRole("main").getByText("一度に処理できるのは 1,500 行までです").first()).toBeVisible();

  const invalidCsv = [
    "社員番号,氏名,フリガナ,生年月日,入社日,拠点",
    "E2E-INVALID,,イーツーイー,not-a-date,2026-04-01,本社",
  ].join("\n");

  await page.getByRole("main").locator('input[type="file"]').first().setInputFiles({
    name: "invalid-employees.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`\uFEFF${invalidCsv}`, "utf8"),
  });

  await expect(page.getByText("事前チェック結果")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/1行中/)).toBeVisible();
  await expect(page.getByText("エラーCSVを出力")).toBeVisible();
  await expect(page.getByText(/氏名/).first()).toBeVisible();
});
