import { test, expect } from '@playwright/test';
import { openAiChatCard } from './helpers.js';

test.describe('Homepage carousel', () => {
  test('loads with all six cards present (positive)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.carousel-card')).toHaveCount(6);
  });

  test('opens the MY AI panel from its card (positive)', async ({ page }) => {
    await page.goto('/');
    await openAiChatCard(page);
    await expect(page.locator('.holo-ai-panel')).toBeVisible();
  });

  test('closes the MY AI panel on Escape (positive)', async ({ page }) => {
    await page.goto('/');
    await openAiChatCard(page);
    await expect(page.locator('.holo-ai-panel')).toBeVisible();
    await page.keyboard.press('Escape');
    // The panel keeps `render` true for a 520ms exit animation before
    // actually unmounting (HolographicAI.jsx) — give it room.
    //
    // KNOWN FLAKE, and it is the app's fault rather than the test's: pressing
    // Escape while the panel is still animating open can leave it stuck
    // mounted-but-invisible, with document.body.style.overflow pinned to
    // 'hidden' so the page can no longer scroll. Reproduced on the deployed
    // site too, so it predates this test. All six Holographic* panels share
    // the open/render/visible effect responsible.
    await expect(page.locator('.holo-ai-panel')).toBeHidden({ timeout: 2000 });
  });

  test('does not throw a page error on load (negative — regression guard)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });
});

test.describe('Dark mode toggle', () => {
  test('switches data-theme to dark and back to light (positive)', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('.theme-toggle');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await toggle.click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
  });

  test('persists the choice across a reload (positive)', async ({ page }) => {
    await page.goto('/');
    await page.locator('.theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('Route navigation', () => {
  test('navigates to /music and /ceske-realie and back without a broken layout (positive)', async ({ page }) => {
    await page.goto('/');
    await page.goto('/music');
    await expect(page.locator('body')).toBeVisible();
    await page.goto('/ceske-realie');
    await expect(page.locator('.ceske-shell')).toBeVisible();
    await page.goto('/');
    await expect(page.locator('.carousel-card').first()).toBeVisible();
  });

  test('an unknown route does not crash the app (negative)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/this-route-does-not-exist');
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
});
