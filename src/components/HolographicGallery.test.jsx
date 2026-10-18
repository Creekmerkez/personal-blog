import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HolographicGallery from './HolographicGallery';

vi.mock('./photosData', () => ({
  default: Array.from({ length: 14 }, (_, i) => ({ id: `p${i}`, src: `/p${i}.jpg`, alt: `Photo ${i + 1}` })),
}));

const screenIs = (phone) =>
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: phone && query === '(max-width: 600px)',
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));

afterEach(() => vi.restoreAllMocks());

describe('HolographicGallery', () => {
  it('on a phone shows every photo in one grid, without page arrows (positive)', async () => {
    screenIs(true);
    render(<HolographicGallery open onClose={() => {}} />);
    const tiles = await screen.findAllByRole('button', { name: /^Expand / });
    expect(tiles).toHaveLength(14);
    expect(tiles[0]).not.toHaveAttribute('style');
    expect(screen.queryByRole('button', { name: 'Next photos' })).toBeNull();
    await userEvent.click(tiles[13]);
    // the tile's thumbnail, and now the full photo in the viewer
    const [, opened] = screen.getAllByRole('img', { name: 'Photo 14' });
    expect(opened.closest('figure')).not.toBeNull();
  });

  it('on a larger screen keeps the collage pages and arrows (negative)', async () => {
    screenIs(false);
    render(<HolographicGallery open onClose={() => {}} />);
    const tiles = await screen.findAllByRole('button', { name: /^Expand / });
    expect(tiles).toHaveLength(12);
    expect(tiles[0].style.left).not.toBe('');
    expect(screen.getByRole('button', { name: 'Next photos' })).toBeInTheDocument();
  });

  it('closes from its × button', async () => {
    screenIs(true);
    const onClose = vi.fn();
    render(<HolographicGallery open onClose={onClose} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
