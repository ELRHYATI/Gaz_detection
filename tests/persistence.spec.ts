import { test, expect } from '@playwright/test';

test.describe('Persistence across reloads', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('Theme toggle persists after reload', async ({ page }) => {
    // Toggle theme
    const themeBtn = page.getByRole('button', { name: /toggle theme/i });
    await themeBtn.click();

    // Verify dark class is present
    await expect(async () => {
      const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(hasDark).toBeTruthy();
    }).toPass();

    // Reload and verify still dark
    await page.reload();
    const stillDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(stillDark).toBeTruthy();
  });

  test('Locale toggle persists after reload', async ({ page }) => {
    const langBtn = page.getByRole('button', { name: /toggle language/i });
    const before = await langBtn.textContent();
    await langBtn.click();
    await page.reload();
    const after = await page.getByRole('button', { name: /toggle language/i }).textContent();
    expect(after).not.toEqual(before);
  });

  test('Compact view setting persists after reload', async ({ page }) => {
    const compactLabel = page.getByText(/compact view/i);
    const checkbox = compactLabel.locator('xpath=preceding-sibling::input');
    await checkbox.check();
    await page.reload();
    await expect(page.getByText(/compact view/i).locator('xpath=preceding-sibling::input')).toBeChecked();
  });
});