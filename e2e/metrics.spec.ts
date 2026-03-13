import { test, expect } from "@playwright/test";

test.describe("Metrics Dashboard", () => {
  test("dashboard loads with metric cards", async ({ page }) => {
    await page.goto("/?view=metrics");
    await page.waitForSelector("[data-testid=metrics-dashboard]");

    // Check that key metric card titles are present
    await expect(page.getByText("Weight", { exact: true })).toBeVisible();
    await expect(page.getByText("Sleep", { exact: true })).toBeVisible();
    await expect(page.getByText("Pullups", { exact: true })).toBeVisible();
    await expect(page.getByText("Protein", { exact: true })).toBeVisible();
  });

  test("streak cards render", async ({ page }) => {
    await page.goto("/?view=metrics");
    await page.waitForSelector("[data-testid=metrics-dashboard]");

    await expect(page.getByText("Alcohol-Free")).toBeVisible();
    await expect(page.getByText("Fasting Compliance")).toBeVisible();
  });

  test("personal records section renders with record cards", async ({ page }) => {
    await page.goto("/?view=metrics");
    await page.waitForSelector("[data-testid=metrics-dashboard]");

    const section = page.locator("[data-testid=records-section]");
    await expect(section).toBeVisible();
    await expect(section.getByText("Personal Records")).toBeVisible();

    // At least one record card should be present (real data exists)
    const cards = section.locator("[data-testid^=section-]");
    await expect(cards.first()).toBeVisible();
  });

  test("streak cards show longest streak info", async ({ page }) => {
    await page.goto("/?view=metrics");
    await page.waitForSelector("[data-testid=metrics-dashboard]");

    // Streak cards should be visible
    await expect(page.getByText("Alcohol-Free")).toBeVisible();
    await expect(page.getByText("Fasting Compliance")).toBeVisible();

    // At least one streak card should show either "BEST" badge or "Best: N days" text
    const bestBadges = page.locator("[data-testid=streak-best-badge]");
    const longestTexts = page.locator("[data-testid=streak-longest]");
    const bestCount = await bestBadges.count();
    const longestCount = await longestTexts.count();
    expect(bestCount + longestCount).toBeGreaterThan(0);
  });

  test("metric cards render sparkline charts", async ({ page }) => {
    await page.goto("/?view=metrics");
    await page.waitForSelector("[data-testid=metrics-dashboard]");

    // Each metric card with data should render an SVG sparkline
    const sparklines = page.locator("svg[role=img][aria-label='Sparkline chart']");
    const count = await sparklines.count();
    // At least weight and pullups should have data to chart
    expect(count).toBeGreaterThan(0);

    // Verify SVG contains path elements (the trend line)
    const firstSparkline = sparklines.first();
    await expect(firstSparkline.locator("path").first()).toBeVisible();
  });

  test("range selector switches between periods", async ({ page }) => {
    await page.goto("/?view=metrics");
    await page.waitForSelector("[data-testid=metrics-dashboard]");

    // Switch to 7 days
    await page.getByRole("button", { name: "7d" }).click();
    await expect(page.locator("[data-testid=metrics-dashboard]")).toBeVisible();

    // Switch to 90 days
    await page.getByRole("button", { name: "90d" }).click();
    await expect(page.locator("[data-testid=metrics-dashboard]")).toBeVisible();
  });
});
