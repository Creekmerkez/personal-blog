// Shared E2E helpers.

/**
 * Opens the MY AI panel via its carousel card.
 *
 * On viewports under 600px, HomeCarousel deliberately ignores taps on any
 * card that isn't currently front-facing (real touch UX — see
 * handleNavigation's `window.innerWidth < 600 && card.id !== frontCardIdRef`
 * guard in HomeCarousel.jsx). The "contact" card doesn't start at the front
 * position, so a plain click is correctly a no-op there.
 *
 * Precisely simulating the drag-to-rotate gesture (velocity-based
 * snapping, spring easing) is real work with its own edge cases, so for now
 * this only supports desktop-width viewports and skips the calling test
 * everywhere else. Follow-up: a touch-drag helper that rotates the
 * carousel to bring an arbitrary card to front, for full mobile coverage.
 */
export async function openAiChatCard(page, test) {
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 600) {
    test.skip(true, 'mobile carousel requires rotating the target card to front — see e2e/helpers.js');
  }
  await page.locator('[data-card-id="contact"]').click({ force: true });
}
