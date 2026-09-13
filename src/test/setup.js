import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Unmounts anything rendered by the previous test so component state (and
// side effects like document.body.style mutations some components make)
// don't leak across tests.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement matchMedia — several components read
// prefers-reduced-motion / hover capability via it. Default to "no match"
// so tests don't crash; individual tests override with their own mock when
// they need a specific media query result.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
