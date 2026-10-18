import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HolographicYouTube from './HolographicYouTube';

const screenIs = (phone) =>
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: phone && query === '(max-width: 600px)',
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));

afterEach(() => vi.restoreAllMocks());

describe('HolographicYouTube', () => {
  it('on a phone lists the videos like YouTube and plays one on tap (positive)', async () => {
    screenIs(true);
    const { container } = render(<HolographicYouTube open onClose={() => {}} />);
    const items = await screen.findAllByRole('button', { name: /^Play / });
    expect(items).toHaveLength(6);
    expect(container.querySelectorAll('.holo-yt-play')).toHaveLength(6);
    expect(items[0]).toHaveTextContent('DJ Merkuz · YouTube');
    await userEvent.click(items[0]);
    expect(container.querySelector('iframe').src).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/.+autoplay=1/);
  });

  it('on a larger screen keeps the collage, not the list (negative)', async () => {
    screenIs(false);
    const { container } = render(<HolographicYouTube open onClose={() => {}} />);
    await screen.findAllByRole('button', { name: /^Play / });
    expect(container.querySelector('.holo-yt-list')).toBeNull();
    expect(container.querySelectorAll('.holo-video-tile')).toHaveLength(6);
  });
});
