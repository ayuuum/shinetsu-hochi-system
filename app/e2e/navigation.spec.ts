import { test, expect } from "@playwright/test";

const pages = [
  { path: "/employees", heading: "社員台帳" },
  { path: "/qualifications", heading: "資格・講習管理" },
  { path: "/vehicles", heading: "車両・備品" },
  { path: "/alcohol-checks", heading: "アルコールチェック" },
];

for (const entry of pages) {
  test(`${entry.path} smoke`, async ({ page }) => {
    await page.goto(entry.path);
    await expect(page.getByRole("heading", { name: entry.heading })).toBeVisible();
  });
}
