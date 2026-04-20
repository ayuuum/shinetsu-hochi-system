import { expect, type Locator, type Page } from "@playwright/test";

export function uniqueSuffix() {
  return Date.now().toString().slice(-8);
}

export async function chooseSelectOption(
  page: Page,
  trigger: Locator,
  optionText: string,
) {
  await trigger.click();
  const option = page.locator("[data-slot='select-content']").last().getByText(optionText, { exact: true });
  await expect(option).toBeVisible();
  await option.click();
}
