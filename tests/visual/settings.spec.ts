import { test, expect } from '@playwright/test';

test.describe('Settings semantic layout', () => {
  test('renders and matches screenshot', async ({ page }) => {
    await page.goto('http://localhost:5173/settings-semantic');
    await page.waitForSelector('main.settings');
    // Compare against baseline; run once to create the snapshot.
    await expect(page).toHaveScreenshot('settings-semantic.png', { fullPage: true });
  });
});