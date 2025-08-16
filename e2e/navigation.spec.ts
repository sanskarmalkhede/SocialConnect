import { test, expect } from "@playwright/test";

test.describe("Navigation and Layout", () => {
  test("should display responsive navigation", async ({ page }) => {
    await page.goto("/");

    // Check logo is visible
    await expect(page.locator("text=SocialConnect")).toBeVisible();

    // Check main navigation items
    await expect(page.locator("text=Sign In")).toBeVisible();
    await expect(page.locator("text=Get Started")).toBeVisible();
  });

  test("should display feature cards on landing page", async ({ page }) => {
    await page.goto("/");

    // Check feature cards
    await expect(page.locator("text=Connect")).toBeVisible();
    await expect(page.locator("text=Share")).toBeVisible();
    await expect(page.locator("text=Engage")).toBeVisible();
    await expect(page.locator("text=Discover")).toBeVisible();
  });

  test("should display footer information", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=© 2024 SocialConnect")).toBeVisible();
    await expect(
      page.locator("text=Built with Next.js and Supabase")
    ).toBeVisible();
  });

  test("should handle mobile responsive design", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto("/");

    // Should still show main elements
    await expect(page.locator("text=SocialConnect")).toBeVisible();
    await expect(
      page.locator("text=Connect with your community")
    ).toBeVisible();
  });

  test("should navigate back from auth pages", async ({ page }) => {
    await page.goto("/auth/login");

    // Should be able to go back to home
    await page.goBack();
    await expect(page).toHaveURL("/");
  });

  test("should handle 404 pages gracefully", async ({ page }) => {
    const response = await page.goto("/non-existent-page");
    expect(response?.status()).toBe(404);
  });

  test("should display proper page titles", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SocialConnect/);

    await page.goto("/auth/login");
    await expect(page).toHaveTitle(/Sign In/);

    await page.goto("/auth/register");
    await expect(page).toHaveTitle(/Sign Up/);
  });
});
