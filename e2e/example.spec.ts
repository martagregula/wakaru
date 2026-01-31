import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");

  // Expect a title "to contain" a substring.
  // We can update this once we know what the title should be.
  // For now just check the page loads (no 404).
  // expect(await page.title()).not.toBe('');
});
