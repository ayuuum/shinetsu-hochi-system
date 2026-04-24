import { test, expect, type Locator, type Page } from "@playwright/test";
import { collectNavigationEntry, measureVisibleDuration } from "./helpers/perf";

type RouteMeasurement = {
  route: string;
  heading: RegExp | string;
  keyContent: (page: Page) => Locator;
  budgetMs: number;
};

const routeMeasurements: RouteMeasurement[] = [
  {
    route: "/",
    heading: /今日の業務状況を先に把握する/,
    keyContent: (page) => page.getByRole("link", { name: /資格タスクを見る/ }),
    budgetMs: 2500,
  },
  {
    route: "/employees",
    heading: /社員台帳/,
    keyContent: (page) => page.getByRole("button", { name: /CSV出力/ }),
    budgetMs: 2500,
  },
  {
    route: "/qualifications",
    heading: /資格・講習管理/,
    keyContent: (page) => page.getByText("期限切れ", { exact: true }),
    budgetMs: 2500,
  },
  {
    route: "/projects",
    heading: /施工実績ログ/,
    keyContent: (page) => page.getByRole("button", { name: /Excel出力/ }),
    budgetMs: 2500,
  },
  {
    route: "/vehicles",
    heading: /車両・備品/,
    keyContent: (page) => page.getByRole("heading", { name: /車両/ }),
    budgetMs: 2500,
  },
  {
    route: "/health-checks",
    heading: /健康診断管理/,
    keyContent: (page) => page.getByRole("button", { name: /健康診断追加/ }),
    budgetMs: 2500,
  },
  {
    route: "/alcohol-checks",
    heading: /アルコールチェック/,
    keyContent: (page) => page.getByRole("heading", { name: /月次記録率レポート/ }),
    budgetMs: 2500,
  },
  {
    route: "/schedule",
    heading: /年間スケジュール・目標/,
    keyContent: (page) => page.getByText(/年度/).first(),
    budgetMs: 2500,
  },
];

type DetailMeasurement = {
  tab: "basic" | "construction" | "qualifications";
  keyContent: (page: Page) => Locator;
  budgetMs: number;
};

const detailMeasurements: DetailMeasurement[] = [
  {
    tab: "basic",
    keyContent: (page) => page.getByText("個人・連絡先", { exact: true }).first(),
    budgetMs: 3000,
  },
  {
    tab: "construction",
    keyContent: (page) => page.getByText("施工実績履歴", { exact: true }).first(),
    budgetMs: 3000,
  },
  {
    tab: "qualifications",
    keyContent: (page) => page.getByText("保有資格一覧", { exact: true }).first(),
    budgetMs: 3000,
  },
];

async function logMeasurement(page: Page, route: string, label: string, durationMs: number) {
  const navigation = await collectNavigationEntry(page);
  console.log(
    `[perf] route=${route} run=${label} visible=${durationMs}ms domContentLoaded=${navigation.domContentLoaded}ms load=${navigation.load}ms type=${navigation.type ?? "unknown"}`,
  );
}

async function getEmployeeDetailBasePath(page: Page) {
  await page.goto("/employees");
  await expect(page.getByRole("heading", { name: /社員台帳/ })).toBeVisible();

  const href = await page.locator("a").evaluateAll((links) => {
    for (const link of links) {
      const href = link.getAttribute("href");
      if (href && /^\/employees\/[0-9a-f-]{36}$/.test(href)) {
        return href;
      }
    }
    return null;
  });

  expect(href, "employee detail path").toBeTruthy();
  return href as string;
}

for (const measurement of routeMeasurements) {
  test(`perf ${measurement.route}`, async ({ page }) => {
    const heading = page.getByRole("heading", { name: measurement.heading });

    const firstHeadingVisible = await measureVisibleDuration(
      page,
      async () => {
        await page.goto(measurement.route);
      },
      heading,
    );
    await logMeasurement(page, measurement.route, "first-heading", firstHeadingVisible);
    expect(firstHeadingVisible).toBeLessThan(measurement.budgetMs);

    const firstContentVisible = await measureVisibleDuration(
      page,
      async () => {},
      measurement.keyContent(page),
    );
    await logMeasurement(page, measurement.route, "first-content", firstContentVisible);

    const secondHeadingVisible = await measureVisibleDuration(
      page,
      async () => {
        await page.goto(measurement.route);
      },
      heading,
    );
    await logMeasurement(page, measurement.route, "second-heading", secondHeadingVisible);
    expect(secondHeadingVisible).toBeLessThan(measurement.budgetMs);

    const secondContentVisible = await measureVisibleDuration(
      page,
      async () => {},
      measurement.keyContent(page),
    );
    await logMeasurement(page, measurement.route, "second-content", secondContentVisible);
  });
}

for (const detail of detailMeasurements) {
  test(`perf employee detail ${detail.tab}`, async ({ page }) => {
    const basePath = await getEmployeeDetailBasePath(page);
    const route = detail.tab === "basic" ? basePath : `${basePath}?tab=${detail.tab}`;

    const heading = page.locator("h1").first();

    const firstHeadingVisible = await measureVisibleDuration(
      page,
      async () => {
        await page.goto(route);
      },
      heading,
    );
    await logMeasurement(page, route, "first-heading", firstHeadingVisible);
    expect(firstHeadingVisible).toBeLessThan(detail.budgetMs);

    const firstContentVisible = await measureVisibleDuration(
      page,
      async () => {},
      detail.keyContent(page),
    );
    await logMeasurement(page, route, "first-content", firstContentVisible);

    const secondHeadingVisible = await measureVisibleDuration(
      page,
      async () => {
        await page.goto(route);
      },
      heading,
    );
    await logMeasurement(page, route, "second-heading", secondHeadingVisible);
    expect(secondHeadingVisible).toBeLessThan(detail.budgetMs);

    const secondContentVisible = await measureVisibleDuration(
      page,
      async () => {},
      detail.keyContent(page),
    );
    await logMeasurement(page, route, "second-content", secondContentVisible);
  });
}
