import { expect, test } from "@playwright/test";

const detailTabs = [
  { tab: "basic", label: "基本情報" },
  { tab: "qualifications", label: "保有資格" },
  { tab: "construction", label: "施工実績" },
  { tab: "health", label: "健康診断" },
];

test("employee detail tab URLs render their tab content", async ({ page }) => {
  await page.goto("/employees");
  await expect(page.getByRole("heading", { name: "社員台帳" })).toBeVisible();

  const firstDetailLink = page.locator('a[href*="/employees/"][href*="?tab="], a[href^="/employees/"]').first();
  const href = await firstDetailLink.getAttribute("href");
  test.skip(!href, "No employee detail link is available in the current test data.");

  const employeePath = href!.split("?")[0];

  for (const entry of detailTabs) {
    await page.goto(`${employeePath}?tab=${entry.tab}`);
    await expect(page.getByRole("link", { name: entry.label }).or(page.getByRole("tab", { name: entry.label }))).toBeVisible();
    await expect(page.getByText(entry.label).first()).toBeVisible();
  }
});

