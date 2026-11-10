import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizerProvider } from '../lib/OrganizerProvider';
import { memoryStorage } from '../lib/storage';
import { emptyData } from '../lib/backup';
import WordsScreen from './WordsScreen';

const TODAY = 20261110;
const word = (name, extra) => ({ id: name, word: name, translation: 'x', notes: '', successfulRecalls: 0, nextReviewDayKey: TODAY, isLearned: false, createdAt: 0, ...extra });

describe('Word of the Day checks', () => {
  it('a word back after its week is a check: remembered once, it is learned (positive)', async () => {
    const storage = memoryStorage({ data: { ...emptyData(), words: [word('kniha', { checks: 1 })] }, settings: { rotationSize: 20 } });
    render(<OrganizerProvider storage={storage} today={TODAY}><WordsScreen /></OrganizerProvider>);
    expect(await screen.findByText('Week check: remember it, and it’s learned')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show Translation' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remembered' }));
    expect((await storage.get('data')).words[0].isLearned).toBe(true);
  });

  it('a word from the earlier rule that already passed a rest moves to Learned (positive)', async () => {
    const storage = memoryStorage({ data: { ...emptyData(), words: [word('dům', { rests: 3, nextReviewDayKey: TODAY + 20 })] }, settings: { rotationSize: 20 } });
    render(<OrganizerProvider storage={storage} today={TODAY}><WordsScreen /></OrganizerProvider>);
    await screen.findByText(/learned/i);
    await new Promise((r) => setTimeout(r, 50));
    expect((await storage.get('data')).words[0]).toMatchObject({ isLearned: true });
  });
});
