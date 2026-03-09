import { test, expect } from "@playwright/test";
import { TEST_DATE } from "./fixtures/test-data";

test.describe("Navigation", () => {
  test("calendar day click navigates to daily view", async ({ page }) => {
    await page.goto(`/?month=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=calendar-grid]");

    await page.locator(`[data-testid="day-${TEST_DATE}"]`).click();
    await expect(page).toHaveURL(/view=daily/);
    await expect(page).toHaveURL(new RegExp(`date=${TEST_DATE}`));
    await page.waitForSelector("[data-testid=day-detail]");
  });

  test("nav links switch between views", async ({ page }) => {
    // Start at calendar
    await page.goto("/");
    await page.waitForSelector("[data-testid=calendar-grid]");

    // Click Weekly
    await page.getByRole("link", { name: "Weekly" }).click();
    await page.waitForSelector("[data-testid=weekly-view]");

    // Click Metrics
    await page.getByRole("link", { name: "Metrics" }).click();
    await page.waitForSelector("[data-testid=metrics-dashboard]");

    // Click Calendar
    await page.getByRole("link", { name: "Calendar" }).click();
    await page.waitForSelector("[data-testid=calendar-grid]");
  });

  test("WK column click navigates to weekly view", async ({ page }) => {
    await page.goto(`/?month=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=calendar-grid]");

    // Click any week summary button
    const weekSummary = page.locator("[data-testid^=week-summary-]").first();
    await weekSummary.click();
    await expect(page).toHaveURL(/view=weekly/);
    await page.waitForSelector("[data-testid=weekly-view]");
  });

  test("back link from daily view returns to calendar", async ({ page }) => {
    await page.goto(`/?view=daily&date=${TEST_DATE}&month=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=day-detail]");

    await page.getByLabel("Back to calendar").click();
    await page.waitForSelector("[data-testid=calendar-grid]");
  });
});
