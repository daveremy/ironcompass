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
