import { test, expect } from "@playwright/test";

const pages = [
  { path: "/dashboard", heading: "本日の業務状況" },
  { path: "/employees", heading: "社員台帳" },
  { path: "/qualifications", heading: "資格・講習管理" },
  { path: "/projects", heading: "施工実績ログ" },
  { path: "/vehicles", heading: "車両・備品" },
  { path: "/health-checks", heading: "健康診断管理" },
  { path: "/alcohol-checks", heading: "アルコールチェック" },
  { path: "/schedule", heading: "年間スケジュール" },
  { path: "/import", heading: "データインポート" },
  { path: "/operations-log", heading: "運用履歴" },
  { path: "/admin/users", heading: "ユーザー管理" },
];

for (const entry of pages) {
  test(`${entry.path} smoke`, async ({ page }) => {
    await page.goto(entry.path);
    await expect(page.getByRole("heading", { name: entry.heading })).toBeVisible();
  });
}
