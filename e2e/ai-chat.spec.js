import { test, expect } from '@playwright/test';
import { openAiChatCard } from './helpers.js';

// The worker call itself (VITE_WORKER_URL, a live Cloudflare Worker) is not
// mocked here on purpose — these tests only assert on UI mechanics that
// don't depend on what the model actually replies, since that's
// non-deterministic and shouldn't make a test suite flaky.

test.describe('MY AI chat', () => {
  test('opens with the welcome message in English by default (positive)', async ({ page }) => {
    await page.goto('/');
    await openAiChatCard(page, test);
    await expect(page.locator('.holo-ai-msg--ai').first()).toContainText("Julia's AI");
  });

  test('EN/UA toggle switches the welcome message, subtitle, and placeholder language (positive)', async ({ page }) => {
    await page.goto('/');
    await openAiChatCard(page, test);

    await page.locator('.holo-ai-lang-btn', { hasText: 'UA' }).click();
    await expect(page.locator('.holo-ai-msg--ai').first()).toContainText('Юлії');
    await expect(page.locator('.holo-ai-input')).toHaveAttribute('placeholder', 'Запитайте мене...');
    await expect(page.locator('.holo-ai-lang-btn', { hasText: 'UA' })).toHaveClass(/active/);
    await expect(page.locator('.holo-ai-lang-btn', { hasText: 'EN' })).not.toHaveClass(/active/);
  });

  test('typing and sending shows the user message immediately (positive)', async ({ page }) => {
    await page.goto('/');
    await openAiChatCard(page, test);

    await page.locator('.holo-ai-input').fill('What does Julia do for work?');
    await page.locator('.holo-ai-send').click();

    await expect(page.locator('.holo-ai-msg--user').last()).toHaveText('What does Julia do for work?');
    await expect(page.locator('.holo-ai-input')).toHaveValue('');
  });

  test('the send button is disabled on empty input (negative)', async ({ page }) => {
    await page.goto('/');
    await openAiChatCard(page, test);
    await expect(page.locator('.holo-ai-send')).toBeDisabled();
  });

  test('a message longer than 500 characters is capped by maxLength (negative)', async ({ page }) => {
    await page.goto('/');
    await openAiChatCard(page, test);

    const longText = 'a'.repeat(600);
    await page.locator('.holo-ai-input').fill(longText);
    const value = await page.locator('.holo-ai-input').inputValue();
    expect(value.length).toBeLessThanOrEqual(500);
  });

  test('closing and reopening the panel resets the mic to "not listening" (regression guard)', async ({ page }) => {
    await page.goto('/');
    await openAiChatCard(page, test);
    const micButton = page.locator('.holo-ai-mic');
    if (await micButton.count() === 0) test.skip(true, 'SpeechRecognition unsupported in this browser project');

    await page.keyboard.press('Escape');
    await expect(page.locator('.holo-ai-panel')).toBeHidden();
    await openAiChatCard(page, test);
    await expect(page.locator('.holo-ai-mic.listening')).toHaveCount(0);
  });
});
