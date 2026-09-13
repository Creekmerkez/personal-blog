import { test, expect } from '@playwright/test';

// NOTE: once a purchase option is selected, CeskeRealiePage renders its
// price/notice/form block TWICE — once for the mobile layout
// (.ceske-selection--inline) and once for desktop (.ceske-selection--below)
// — both exist in the DOM simultaneously, swapped via CSS display:none at
// the 800px breakpoint (see CeskeRealiePage.css). Every locator below is
// scoped with :visible so it resolves to whichever copy the current
// viewport actually shows, instead of hitting Playwright's strict-mode
// "resolved to 2 elements" error. This duplication is a real accessibility
// finding in its own right — see the security/audit report.

test.describe('České Reálie purchase page', () => {
  test('selecting the digital edition hides the price and shows the request-only notice (positive)', async ({ page }) => {
    await page.goto('/ceske-realie');
    await page.locator('.ceske-option-card').first().click();
    await expect(page.locator('.digital-notice-text:visible')).toBeVisible();
    await expect(page.locator('.selected-price:visible')).toHaveCount(0);
    await expect(page.locator('button:visible', { hasText: /request digital copy/i })).toBeVisible();
  });

  test('selecting the printed edition shows the price and purchase button (positive)', async ({ page }) => {
    await page.goto('/ceske-realie');
    await page.locator('.ceske-option-card').nth(1).click();
    await expect(page.locator('.selected-price:visible')).toHaveText('700 CZK');
    await expect(page.locator('button:visible', { hasText: /continue to purchase/i })).toBeVisible();
    await expect(page.locator('.digital-notice-text:visible')).toHaveCount(0);
  });

  test('clicking the page margin (outside the card) navigates back to the homepage (positive)', async ({ page }) => {
    await page.goto('/ceske-realie');
    await page.mouse.click(10, 400);
    await expect(page).toHaveURL('/');
    await expect(page.locator('.carousel-card').first()).toBeVisible();
  });

  test('clicking inside the card does not navigate away (negative)', async ({ page }) => {
    await page.goto('/ceske-realie');
    await page.locator('.ceske-title').click();
    await expect(page).toHaveURL(/\/ceske-realie$/);
  });

  test('the contact form rejects an empty required field (negative)', async ({ page }) => {
    await page.goto('/ceske-realie');
    await page.locator('.ceske-option-card').nth(1).click();
    await page.locator('button:visible', { hasText: /continue to purchase/i }).click();

    const nameInput = page.locator('input[type="text"].ceske-form-input:visible');
    await expect(nameInput).toBeVisible();
    // Submit with every field empty — native HTML5 validation should block it.
    await page.locator('button:visible', { hasText: /send request/i }).click();
    // The browser's own validation keeps the field itself; the request
    // form must not silently show the (physical-only) success state.
    await expect(page.locator('.ceske-form-success:visible')).toHaveCount(0);
    await expect(nameInput).toHaveJSProperty('validity.valid', false);
  });

  test('the contact form rejects an invalid email format (negative)', async ({ page }) => {
    await page.goto('/ceske-realie');
    await page.locator('.ceske-option-card').nth(1).click();
    await page.locator('button:visible', { hasText: /continue to purchase/i }).click();

    await page.locator('input[type="text"].ceske-form-input:visible').fill('Test User');
    const emailInput = page.locator('input[type="email"]:visible');
    await emailInput.fill('not-an-email');
    await page.locator('button:visible', { hasText: /send request/i }).click();
    await expect(emailInput).toHaveJSProperty('validity.valid', false);
  });
});
