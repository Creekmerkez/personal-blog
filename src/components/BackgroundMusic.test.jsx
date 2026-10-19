import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackgroundMusic from './BackgroundMusic';
import { hushMusic } from './musicHush';

let play;
let pause;
beforeEach(() => {
  localStorage.clear();
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

const tapPage = () => act(async () => {
  fireEvent.pointerUp(document.body);
});

describe('BackgroundMusic', () => {
  it('starts on the first tap anywhere, and its button turns it off for good (positive)', async () => {
    render(<BackgroundMusic />);
    expect(play).not.toHaveBeenCalled();
    await tapPage();
    expect(play).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Turn music off' }));
    expect(pause).toHaveBeenCalled();
    expect(localStorage.getItem('music')).toBe('off');
    expect(screen.getByRole('button', { name: 'Turn music on' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('stays silent for a visitor who switched it off before (negative)', async () => {
    localStorage.setItem('music', 'off');
    render(<BackgroundMusic />);
    await tapPage();
    expect(play).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Turn music on' }));
    expect(play).toHaveBeenCalled();
  });

  it('sets and remembers the volume (positive)', () => {
    render(<BackgroundMusic />);
    const audio = document.querySelector('audio');
    expect(audio.volume).toBeCloseTo(0.3);
    fireEvent.change(screen.getByRole('slider', { name: 'Music volume' }), { target: { value: '0.6' } });
    expect(audio.volume).toBeCloseTo(0.6);
    expect(localStorage.getItem('musicVolume')).toBe('0.6');
  });

  it('waits while a video with sound or a YouTube video plays, not for a muted one (positive and negative)', async () => {
    render(<BackgroundMusic />);
    await tapPage();
    const video = document.createElement('video');
    document.body.appendChild(video);
    pause.mockClear();
    video.muted = true;
    act(() => { video.dispatchEvent(new Event('play')); });
    expect(pause).not.toHaveBeenCalled();
    video.muted = false;
    act(() => { video.dispatchEvent(new Event('play')); });
    expect(pause).toHaveBeenCalled();
    play.mockClear();
    act(() => { video.dispatchEvent(new Event('pause')); });
    expect(play).toHaveBeenCalled();
    pause.mockClear();
    act(() => hushMusic(true));
    expect(pause).toHaveBeenCalled();
    play.mockClear();
    act(() => hushMusic(false));
    expect(play).toHaveBeenCalled();
    video.remove();
  });
});
