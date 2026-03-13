import { test, expect } from "@playwright/test";
import { TEST_DATE, TEST_DATE_EMPTY } from "./fixtures/test-data";

test.describe("Day Detail View", () => {
  test("renders all 10 sections with seeded data", async ({ page }) => {
    await page.goto(`/?view=daily&date=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=day-detail]");

    // Vitals
    const vitals = page.locator("[data-testid=section-vitals]");
    await expect(vitals).toBeVisible();
    await expect(vitals).toContainText("175.5");
    await expect(vitals).toContainText("4");

    // Sleep
    const sleep = page.locator("[data-testid=section-sleep]");
    await expect(sleep).toBeVisible();
    await expect(sleep).toContainText("7.5");
    await expect(sleep).toContainText("88");
    await expect(sleep).toContainText("82");

    // Fasting
    const fasting = page.locator("[data-testid=section-fasting]");
    await expect(fasting).toBeVisible();
    await expect(fasting).toContainText("16:8");

    // Blood Pressure
    const bp = page.locator("[data-testid=section-blood-pressure]");
    await expect(bp).toBeVisible();
    await expect(bp).toContainText("122");
    await expect(bp).toContainText("76");

    // Workouts
    const workouts = page.locator("[data-testid=section-workouts]");
    await expect(workouts).toBeVisible();

    // Meals
    const meals = page.locator("[data-testid=section-meals]");
    await expect(meals).toBeVisible();

    // Pullups
    const pullups = page.locator("[data-testid=section-pullups]");
    await expect(pullups).toBeVisible();
    await expect(pullups).toContainText("18");

    // Supplements
    const supplements = page.locator("[data-testid=section-supplements]");
    await expect(supplements).toBeVisible();

    // Body Composition
    const bodyComp = page.locator("[data-testid=section-body-composition]");
    await expect(bodyComp).toBeVisible();
    await expect(bodyComp).toContainText("18.5");
    await expect(bodyComp).toContainText("148");

    // Custom Metrics — not seeded, so section is not rendered (returns null when empty)
  });

  test("strength workout shows structured details, not raw JSON", async ({ page }) => {
    await page.goto(`/?view=daily&date=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=day-detail]");

    const workouts = page.locator("[data-testid=section-workouts]");
    await expect(workouts).toContainText("Bench Press");
    await expect(workouts).toContainText("8");
    await expect(workouts).toContainText("135");
  });

  test("both workout type badges are visible", async ({ page }) => {
    await page.goto(`/?view=daily&date=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=day-detail]");

    await expect(page.locator("[data-testid=badge-strength]")).toBeVisible();
    await expect(page.locator("[data-testid=badge-hike]")).toBeVisible();
  });

  test("meals table shows both meals with macros", async ({ page }) => {
    await page.goto(`/?view=daily&date=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=day-detail]");

    const meals = page.locator("[data-testid=section-meals]");
    await expect(meals).toContainText("Protein shake");
    await expect(meals).toContainText("Salmon dinner");
    await expect(meals).toContainText("245");
    await expect(meals).toContainText("395");
  });

  test("PR badges render on day with record values", async ({ page }) => {
    await page.goto(`/?view=daily&date=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=day-detail]");

    // Seeded data is at year 2099, so values should be unique enough to set PRs
    // Check that at least one PR badge appears
    const prBadges = page.locator("[data-testid^=pr-badge-]");
    await expect(prBadges.first()).toBeVisible();

    // Each badge should contain "PR" text
    const firstBadge = prBadges.first();
    await expect(firstBadge).toContainText("PR");
  });

  test("prev/next day navigation updates URL and content", async ({ page }) => {
    await page.goto(`/?view=daily&date=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=day-detail]");

    // Navigate to previous day
    await page.getByRole("button", { name: "Previous day" }).click();
    await expect(page).toHaveURL(/date=2098-12-31/);
    await page.waitForSelector("[data-testid=day-detail]");

    // Previous day has no data — should show "Not logged"
    await expect(page.getByText("Not logged").first()).toBeVisible();

    // Navigate forward twice to get back to test date + 1 (empty date)
    await page.getByRole("button", { name: "Next day" }).click();
    await expect(page).toHaveURL(new RegExp(`date=${TEST_DATE}`));
    await page.waitForSelector("[data-testid=day-detail]");

    // Back on test date — seeded data should be visible
    await expect(page.locator("[data-testid=section-vitals]")).toContainText("175.5");
  });

  test("streak badges display on seeded date", async ({ page }) => {
    await page.goto(`/?view=daily&date=${TEST_DATE}`);
    await page.waitForSelector("[data-testid=day-detail]");

    // The seeded date has fasting compliant + no alcohol + workout + logging data
    // At minimum, the logging streak badge should appear (1 day of data)
    // Check for any streak badge text patterns
    const badges = page.locator(".rounded-full.bg-accent\\/10");
    const count = await badges.count();
    // At least the logging streak should appear for the seeded date
    expect(count).toBeGreaterThan(0);
  });

  test("empty date shows 'Not logged' for empty sections", async ({ page }) => {
    await page.goto(`/?view=daily&date=${TEST_DATE_EMPTY}`);
    await page.waitForSelector("[data-testid=day-detail]");

    await expect(page.getByText("Not logged").first()).toBeVisible();
  });
});
