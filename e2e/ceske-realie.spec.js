import { test, expect } from '@playwright/test';

test.describe('České Reálie purchase page', () => {
  test('selecting an option renders exactly one request panel (regression guard)', async ({ page }) => {
    // Used to render this block twice — once per breakpoint, swapped via
    // CSS display:none — which put duplicate form fields in the DOM at
    // once (a real accessibility issue: screen readers, autofill, and
    // password managers all see two of everything). Fixed by positioning
    // a single element with CSS `order` instead of duplicating it.
    await page.goto('/ceske-realie');
    await page.locator('.ceske-option-card').first().click();
    await expect(page.locator('.ceske-selection')).toHaveCount(1);
  });

  test('selecting the digital edition shows the request-only notice (positive)', async ({ page }) => {
    await page.goto('/ceske-realie');
    await page.locator('.ceske-option-card').first().click();
    await expect(page.locator('.digital-notice-text')).toBeVisible();
    await expect(page.getByRole('button', { name: /request a copy/i })).toBeVisible();
  });

  test('selecting the printed edition also shows a request-only notice (positive)', async ({ page }) => {
    await page.goto('/ceske-realie');
    await page.locator('.ceske-option-card').nth(1).click();
    await expect(page.locator('.digital-notice-text')).toBeVisible();
    await expect(page.locator('.digital-notice-text')).toContainText(/isn't sold/i);
    await expect(page.getByRole('button', { name: /request a copy/i })).toBeVisible();
  });

  test('neither edition ever shows a price or sale wording (regression guard)', async ({ page }) => {
    // Showing a price would turn this back into a distance sale, which carries
    // consumer-law duties this page deliberately does not meet (seller
    // identity, delivery terms, 14-day withdrawal right). Julia gives the book
    // away on request instead — this guards that decision against a future
    // edit quietly reintroducing commerce wording.
    await page.goto('/ceske-realie');
    for (const index of [0, 1]) {
      await page.locator('.ceske-option-card').nth(index).click();
      const body = await page.locator('.ceske-shell').innerText();
      expect(body).not.toMatch(/CZK|\bbuy\b|purchase|payment|checkout|order now/i);
    }
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
    await page.getByRole('button', { name: /request a copy/i }).click();

    const nameInput = page.locator('input[type="text"].ceske-form-input');
    await expect(nameInput).toBeVisible();
    // Submit with every field empty — native HTML5 validation should block it.
    await page.getByRole('button', { name: /send request/i }).click();
    // The browser's own validation keeps the field itself; the request
    // form must not silently show the success state.
    await expect(page.locator('.ceske-form-success')).toHaveCount(0);
    await expect(nameInput).toHaveJSProperty('validity.valid', false);
  });

  test('the contact form rejects an invalid email format (negative)', async ({ page }) => {
    await page.goto('/ceske-realie');
    await page.locator('.ceske-option-card').nth(1).click();
    await page.getByRole('button', { name: /request a copy/i }).click();

    await page.locator('input[type="text"].ceske-form-input').fill('Test User');
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('not-an-email');
    await page.getByRole('button', { name: /send request/i }).click();
    await expect(emailInput).toHaveJSProperty('validity.valid', false);
  });
});
