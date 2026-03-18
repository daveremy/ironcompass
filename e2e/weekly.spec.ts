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

  test("summary cards show aggregated data from seeded day", async ({ page }) => {
    await page.goto(`/?view=weekly&date=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=weekly-view]");

    // Workouts card: should show 2 workouts total
    const workouts = page.locator("[data-testid=section-workouts]");
    await expect(workouts).toBeVisible();
    await expect(workouts).toContainText("2");

    // Nutrition card: avg protein from seeded meals (40 + 51 + 35 = 126g)
    const nutrition = page.locator("[data-testid=section-nutrition]");
    await expect(nutrition).toBeVisible();
    await expect(nutrition).toContainText("126");

    // Sleep card: avg hours from seeded sleep (7.5h)
    const sleep = page.locator("[data-testid=section-sleep]");
    await expect(sleep).toBeVisible();
    await expect(sleep).toContainText("7.5");

    // Highlights card: pullups total (9999)
    const highlights = page.locator("[data-testid=section-highlights]");
    await expect(highlights).toBeVisible();
    await expect(highlights).toContainText("9999");
  });

  test("grid shows seeded values in the Thursday column", async ({ page }) => {
    await page.goto(`/?view=weekly&date=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=weekly-view]");

    // Seeded date is Thursday (2099-01-01)
    // Weight should appear in the grid
    await expect(page.getByText("175.5").first()).toBeVisible();

    // Sleep hours
    await expect(page.getByText("7.5").first()).toBeVisible();

    // Fasting compliance checkmark
    await expect(page.getByText("✓").first()).toBeVisible();
  });
});
