import { test, expect } from "@playwright/test";
import { TEST_DATE, TEST_WEEK_MONDAY } from "./fixtures/test-data";

test.describe("Weekly View", () => {
  test("renders with seeded data in the correct day column", async ({ page }) => {
    await page.goto(`/?view=weekly&date=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=weekly-view]");

    // Should show workout data somewhere in the grid (use .first() since text appears in grid + badge)
    await expect(page.getByText("strength").first()).toBeVisible();
    await expect(page.getByText("hike").first()).toBeVisible();
  });

  test("week navigation updates the URL and grid", async ({ page }) => {
    await page.goto(`/?view=weekly&date=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=weekly-view]");

    // Navigate to previous week
    await page.getByLabel("Previous week").click();
    await expect(page).toHaveURL(/date=2098-12-22/);

    // Navigate to next week (back)
    await page.getByLabel("Next week").click();
    await expect(page).toHaveURL(/date=2098-12-29/);
  });
});
