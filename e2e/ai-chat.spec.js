import { test, expect } from '@playwright/test';
import { openAiChatCard } from './helpers.js';

// The worker call itself (VITE_WORKER_URL, a live Cloudflare Worker) is not
// mocked here on purpose — these tests only assert on UI mechanics that
// don't depend on what the model actually replies, since that's
// non-deterministic and shouldn't make a test suite flaky.

test.describe('MY AI chat', () => {
  test('opens with the welcome message in English by default (positive)', async ({ page }) => {
    await page.goto('/');
    await openAiChatCard(page);
    await expect(page.locator('.holo-ai-msg--ai').first()).toContainText("Julia's AI");
  });

  test('EN/UA toggle switches the welcome message, subtitle, and placeholder language (positive)', async ({ page }) => {
    await page.goto('/');
    await openAiChatCard(page);

    await page.locator('.holo-ai-lang-btn', { hasText: 'UA' }).click();
    await expect(page.locator('.holo-ai-msg--ai').first()).toContainText('Юлії');
    await expect(page.locator('.holo-ai-input')).toHaveAttribute('placeholder', 'Запитайте мене...');
    await expect(page.locator('.holo-ai-lang-btn', { hasText: 'UA' })).toHaveClass(/active/);
    await expect(page.locator('.holo-ai-lang-btn', { hasText: 'EN' })).not.toHaveClass(/active/);
  });

  test('typing and sending shows the user message immediately (positive)', async ({ page }) => {
    await page.goto('/');
    await openAiChatCard(page);

    await page.locator('.holo-ai-input').fill('What does Julia do for work?');
    await page.locator('.holo-ai-send').click();

    await expect(page.locator('.holo-ai-msg--user').last()).toHaveText('What does Julia do for work?');
    await expect(page.locator('.holo-ai-input')).toHaveValue('');
  });

  test('the send button is disabled on empty input (negative)', async ({ page }) => {
    await page.goto('/');
    await openAiChatCard(page);
    await expect(page.locator('.holo-ai-send')).toBeDisabled();
  });

  test('a message longer than 500 characters is capped by maxLength (negative)', async ({ page }) => {
    await page.goto('/');
    await openAiChatCard(page);

    const longText = 'a'.repeat(600);
    await page.locator('.holo-ai-input').fill(longText);
    const value = await page.locator('.holo-ai-input').inputValue();
    expect(value.length).toBeLessThanOrEqual(500);
  });

  test('closing and reopening the panel resets the mic to "not listening" (regression guard)', async ({ page }) => {
    await page.goto('/');
    await openAiChatCard(page);
    const micButton = page.locator('.holo-ai-mic');
    if (await micButton.count() === 0) test.skip(true, 'SpeechRecognition unsupported in this browser project');

    await page.keyboard.press('Escape');
    await expect(page.locator('.holo-ai-panel')).toBeHidden();
    await openAiChatCard(page);
    await expect(page.locator('.holo-ai-mic.listening')).toHaveCount(0);
  });

  test('a stale voice-recognition result arriving after Send does not repopulate the cleared input (regression guard)', async ({ page }) => {
    // Reported from real-device use: sending while the mic was still
    // listening left the field showing the old text instead of clearing.
    // Root cause was two-fold: send() never stopped an active recognition
    // session, and onresult had no staleness check — so a result already
    // in flight when stop() is called (real SpeechRecognition can still
    // deliver one after stop(), per spec) would fire afterward and silently
    // repopulate the just-cleared field.
    //
    // The "late result" is triggered manually via window.__fireStaleResult
    // rather than a timer — an earlier version of this test used a 700ms
    // setTimeout meant to fire after Send, but real click/animation timing
    // in this environment turned out to take longer than that, so the
    // "late" result was actually already-delivered *before* Send was even
    // clicked, and the test passed without exercising the race at all.
    // Firing it on command after Send has definitely completed is what
    // actually tests the guard, deterministically.
    await page.addInitScript(() => {
      window.__lastRecognition = null;
      function makeResultEvent(text) {
        const result = [{ transcript: text }];
        result.isFinal = true;
        return { results: [result] };
      }
      window.__fireStaleResult = (text) => {
        window.__lastRecognition?.onresult?.(makeResultEvent(text));
      };
      class FakeSpeechRecognition {
        start() {
          window.__lastRecognition = this;
          Promise.resolve().then(() => this.onaudiostart?.());
        }
        stop() { /* intentionally doesn't invalidate __lastRecognition */ }
        abort() {}
      }
      window.SpeechRecognition = FakeSpeechRecognition;
      window.webkitSpeechRecognition = FakeSpeechRecognition;
    });

    await page.goto('/');
    await openAiChatCard(page);
    await page.locator('.holo-ai-mic').click();
    await page.waitForTimeout(200); // let onaudiostart's microtask settle

    await page.evaluate(() => window.__fireStaleResult('stale voice text'));
    await expect(page.locator('.holo-ai-input')).toHaveValue('stale voice text');

    await page.locator('.holo-ai-send').click();
    await expect(page.locator('.holo-ai-input')).toHaveValue('');

    // The same (now-stale) recognition object's onresult closure still
    // exists and still references its original session — this simulates
    // exactly the straggler-after-stop() scenario, deterministically.
    await page.evaluate(() => window.__fireStaleResult('stale voice text LATE'));
    await expect(page.locator('.holo-ai-input')).toHaveValue('');
  });
});
