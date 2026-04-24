import { expect, type Locator, type Page } from "@playwright/test";

export type NavigationMetrics = {
  domContentLoaded: number;
  load: number;
  type: string | null;
};

export async function measureVisibleDuration(
  page: Page,
  action: () => Promise<unknown>,
  locator: Locator,
) {
  const startedAt = Date.now();
  await action();
  await expect(locator).toBeVisible({ timeout: 30_000 });
  return Date.now() - startedAt;
}

export async function collectNavigationEntry(page: Page): Promise<NavigationMetrics> {
  return page.evaluate(() => {
    const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (!entry) {
      return {
        domContentLoaded: -1,
        load: -1,
        type: null,
      };
    }

    return {
      domContentLoaded: Math.round(entry.domContentLoadedEventEnd),
      load: Math.round(entry.loadEventEnd),
      type: entry.type,
    };
  });
}
