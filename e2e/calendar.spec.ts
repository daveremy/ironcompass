import { test, expect } from "@playwright/test";
import { TEST_DATE } from "./fixtures/test-data";

test.describe("Calendar View", () => {
  test("renders 42 day cells in the grid", async ({ page }) => {
    await page.goto(`/?month=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=calendar-grid]");

    const dayCells = page.locator("[data-testid^=day-]");
    await expect(dayCells).toHaveCount(42);
  });

  test("month navigation updates the grid", async ({ page }) => {
    await page.goto(`/?month=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=calendar-grid]");

    // Should show January 2099
    await expect(page.getByText("January")).toBeVisible();

    // Navigate to previous month
    await page.getByLabel("Previous month").click();
    await expect(page.getByText("December")).toBeVisible();

    // Navigate to next month (back to January)
    await page.getByLabel("Next month").click();
    await expect(page.getByText("January")).toBeVisible();
  });

  test("test date shows 2 workout dots", async ({ page }) => {
    await page.goto(`/?month=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=calendar-grid]");

    const testDay = page.locator(`[data-testid="day-${TEST_DATE}"]`);
    await expect(testDay).toBeVisible();

    // 2 workout dots (strength + hike)
    const dots = testDay.locator("span.rounded-full.w-2.h-2");
    await expect(dots).toHaveCount(2);
  });
});
