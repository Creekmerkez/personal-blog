// Shared E2E helpers.

/**
 * Simulates one "swipe one card over" gesture on the carousel, dispatching
 * real TouchEvents on .carousel-stage — the app listens for native touch
 * events specifically (bypassing the Pointer Events API to dodge an iOS
 * Safari setPointerCapture bug, see HomeCarousel.jsx), so a mouse-based
 * drag wouldn't trigger its rotation logic at all.
 *
 * Distance is deliberately small (60px total, well under the ~75px that
 * would rotate a full extra step: rotation += delta * 0.8, one card-step is
 * 60°) so the drag itself never crosses a second card boundary — the final
 * snap-to-nearest-step behavior (HomeCarousel.jsx's touchend handler) then
 * reliably advances exactly one card in the swipe direction, as long as
 * enough velocity accumulates to clear its 0.2 direction-aware threshold,
 * which 10 steps of 6px each comfortably does.
 */
async function swipeCarouselOneStep(page, direction) {
  await page.evaluate((dir) => {
    const stage = document.querySelector('.carousel-stage');
    const rect = stage.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const distance = 60;
    const steps = 10;

    const dispatch = (type, x) => {
      const touch = new Touch({ identifier: 1, target: stage, clientX: x, clientY: y, pageX: x, pageY: y });
      stage.dispatchEvent(new TouchEvent(type, {
        bubbles: true,
        cancelable: true,
        touches: type === 'touchend' ? [] : [touch],
        targetTouches: type === 'touchend' ? [] : [touch],
        changedTouches: [touch],
      }));
    };

    dispatch('touchstart', startX);
    for (let i = 1; i <= steps; i++) {
      dispatch('touchmove', startX + (dir * distance * i) / steps);
    }
    dispatch('touchend', startX + dir * distance);
  }, direction);
  // Let the spring-snap animation (HomeCarousel's rAF loop, ~diff*0.12/frame)
  // settle before the next swipe or a click.
  await page.waitForTimeout(400);
}

/**
 * Rotates the mobile carousel until the given card is front-facing, then
 * taps it. There are only 6 cards, so at most 5 one-step swipes in a single
 * direction are guaranteed to reach any target from any starting position.
 */
async function rotateAndTapCard(page, cardId) {
  const card = page.locator(`[data-card-id="${cardId}"]`);
  for (let attempt = 0; attempt < 6; attempt++) {
    if (await card.evaluate((el) => el.classList.contains('carousel-card-front'))) {
      await card.click({ force: true });
      return;
    }
    await swipeCarouselOneStep(page, -1);
  }
  throw new Error(`Could not rotate "${cardId}" to front after 6 swipes`);
}

/**
 * Opens the MY AI panel via its carousel card, on any viewport. Desktop
 * just clicks (no front-card restriction there); mobile rotates the
 * carousel first, matching HomeCarousel's own
 * `window.innerWidth < 600 && card.id !== frontCardIdRef.current` guard,
 * which makes taps on a non-front card a deliberate no-op on touch.
 */
export async function openAiChatCard(page) {
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 600) {
    await rotateAndTapCard(page, 'contact');
    return;
  }
  await page.locator('[data-card-id="contact"]').click({ force: true });
}

export { swipeCarouselOneStep, rotateAndTapCard };
