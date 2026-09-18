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
    // The panel keeps `render` true for a nominal 520ms exit animation before
    // unmounting, but that setTimeout is only as punctual as the main thread
    // allows — measured firing 2-3s late while the carousel's rAF loop was
    // busy, which is what made this test flake at a 2s ceiling. The lateness
    // is invisible to a user: the panel has already faded out, its stage is
    // pointer-events:none so clicks pass straight through, and the body scroll
    // lock is released on `visible` rather than `render`. So allow the slow
    // case rather than asserting a punctuality the browser never promised.
    await expect(page.locator('.holo-ai-panel')).toBeHidden({ timeout: 8000 });
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
