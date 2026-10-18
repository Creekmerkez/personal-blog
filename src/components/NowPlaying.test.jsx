import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NowPlaying from './NowPlaying';

const song = { videoId: 'abc123', artist: 'DJ Shadow', title: 'Six Days' };

describe('NowPlaying', () => {
  it('asks nothing of YouTube until play is pressed, then shows a visible player (positive)', async () => {
    const { container } = render(<NowPlaying song={song} />);
    expect(container.querySelector('iframe')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Play DJ Shadow — Six Days' }));
    const frame = container.querySelector('iframe');
    expect(frame.src).toBe('https://www.youtube-nocookie.com/embed/abc123?autoplay=1&playsinline=1&rel=0&modestbranding=1');
    await userEvent.click(screen.getByRole('button', { name: 'Stop and close the music' }));
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('button', { name: /^Play / })).toBeInTheDocument();
  });

  it('shows nothing while no video is set (negative)', () => {
    const { container } = render(<NowPlaying song={{ ...song, videoId: '' }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
