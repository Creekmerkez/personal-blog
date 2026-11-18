import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizerProvider } from '../lib/OrganizerProvider';
import { memoryStorage } from '../lib/storage';
import { emptyData } from '../lib/backup';
import { EVERY_DAY } from '../lib/weekdays';
import TodayScreen from './TodayScreen';

const TODAY = 20261118;
const task = (extra) => ({ id: 'T1', name: 'Reading', details: '', flag: 'green', weekdayMask: EVERY_DAY, isActive: true, completionCount: 5, lastCompletedDayKey: null, sortOrder: 0, createdAt: 0, ...extra });

const show = (data) => {
  const storage = memoryStorage({ data: { ...emptyData(), ...data }, settings: { lastExportAt: Date.now() / 1000 } });
  render(<OrganizerProvider storage={storage} today={TODAY}><TodayScreen onOpenSettings={() => {}} /></OrganizerProvider>);
  return storage;
};

beforeEach(() => vi.spyOn(window, 'scrollTo').mockImplementation(() => {}));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Undo on Today', () => {
  it('a task checked by mistake goes back to To Do with its count (positive)', async () => {
    const storage = show({ myTasks: [task()] });
    await userEvent.click(await screen.findByRole('button', { name: 'Reading', pressed: false }));
    expect(screen.getByRole('status')).toHaveTextContent('Done: Reading');
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reading', pressed: false })).toBeInTheDocument();
    const saved = (await storage.get('data')).myTasks[0];
    expect(saved).toMatchObject({ completionCount: 5, lastCompletedDayKey: null });
  });

  it('a skip by mistake is taken back (positive)', async () => {
    const storage = show({ myTasks: [task()] });
    await userEvent.click(await screen.findByRole('button', { name: 'Skip today: Reading' }));
    expect(screen.getByRole('status')).toHaveTextContent('Skipped today: Reading');
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('button', { name: 'Skip today: Reading' })).toBeInTheDocument();
    expect((await storage.get('data')).myTasks[0].skippedDayKey ?? null).toBeNull();
  });

  it('a workout marked by mistake leaves the history again (positive)', async () => {
    const plans = [{ id: 'A', title: 'Day A', items: ['Plank'] }, { id: 'B', title: 'Day B', items: [] }];
    const storage = show({ myTasks: [task({ name: 'Exercises', exercises: true })], exercisePlans: plans, exerciseLog: [] });
    await userEvent.click(await screen.findByRole('button', { name: 'Exercises', pressed: false }));
    await userEvent.click(screen.getByRole('button', { name: /^Workout/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Done · Day A' }));
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    const saved = await storage.get('data');
    expect(saved.exerciseLog).toEqual([]);
    expect(saved.myTasks[0].completionCount).toBe(5);
  });

  it('the bar goes away by itself after a few seconds (negative)', async () => {
    show({ myTasks: [task()] });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await user.click(await screen.findByRole('button', { name: 'Reading', pressed: false }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6500));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
