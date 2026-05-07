import { expect, test } from "@playwright/test";

const listFilterCases = [
  {
    name: "employees search and branch filters",
    path: "/employees?q=E2E&branch=%E6%9C%AC%E7%A4%BE",
    heading: "社員台帳",
    expectedTexts: ["検索: E2E", "拠点: 本社"],
  },
  {
    name: "qualifications search and level filters",
    path: "/qualifications?q=%E6%B6%88%E9%98%B2&level=urgent",
    heading: "資格・講習管理",
    expectedTexts: ["検索: 消防", "urgent"],
  },
  {
    name: "projects search and category filters",
    path: "/projects?q=%E6%B6%88%E9%98%B2&category=%E6%B6%88%E9%98%B2%E8%A8%AD%E5%82%99%E5%B7%A5%E4%BA%8B",
    heading: "施工実績ログ",
    expectedTexts: ["検索: 消防", "消防設備工事"],
  },
  {
    name: "vehicles search and expiry filters",
    path: "/vehicles?q=E2E&expiry=soon&sort=inspection",
    heading: "車両・備品",
    expectedTexts: ["検索: E2E", "30日以内", "車検満了日"],
  },
  {
    name: "health checks search and result filters",
    path: "/health-checks?q=%E7%97%85%E9%99%A2&result=abnormal",
    heading: "健康診断管理",
    expectedTexts: ["検索: 病院", "要再検査"],
  },
];

for (const entry of listFilterCases) {
  test(entry.name, async ({ page }) => {
    await page.goto(entry.path);
    await expect(page.getByRole("heading", { name: entry.heading })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(entry.path.split("?")[0]));

    for (const text of entry.expectedTexts) {
      await expect(page.getByText(text).first()).toBeVisible();
    }
  });
}
