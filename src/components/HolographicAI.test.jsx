import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HolographicAI from './HolographicAI';

// A stand-in for Safari's visual viewport: the part of the page above the keyboard.
function fakeViewport(height, offsetTop = 0) {
  const viewport = new EventTarget();
  Object.assign(viewport, { height, offsetTop });
  vi.stubGlobal('visualViewport', viewport);
  return viewport;
}

// jsdom has no scrollIntoView.
beforeEach(() => { Element.prototype.scrollIntoView = () => {}; });
afterEach(() => vi.unstubAllGlobals());

describe('HolographicAI on a phone with the keyboard up', () => {
  it('fits the chat to the visible area above the keyboard, and follows it (positive)', () => {
    const viewport = fakeViewport(800);
    render(<MemoryRouter><HolographicAI open onClose={() => {}} /></MemoryRouter>);
    const stage = document.querySelector('.holo-gallery-stage');
    expect(stage.style.height).toBe('800px');
    act(() => {
      Object.assign(viewport, { height: 420, offsetTop: 120 });
      viewport.dispatchEvent(new Event('resize'));
    });
    expect(stage.style.height).toBe('420px');
    expect(stage.style.top).toBe('120px');
    expect(document.querySelector('textarea').getAttribute('autocomplete')).toBe('off');
  });

  it('leaves the layout alone where there is no visual viewport (negative)', () => {
    vi.stubGlobal('visualViewport', undefined);
    render(<MemoryRouter><HolographicAI open onClose={() => {}} /></MemoryRouter>);
    expect(document.querySelector('.holo-gallery-stage').style.height).toBe('');
  });
});
