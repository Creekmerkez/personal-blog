import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizerProvider } from '../lib/OrganizerProvider';
import { memoryStorage } from '../lib/storage';
import { emptyData } from '../lib/backup';
import { EVERY_DAY } from '../lib/weekdays';
import TodayScreen from './TodayScreen';

const TODAY = 20261110;
const task = { id: 'T1', name: 'Exercises', details: '', flag: 'green', weekdayMask: EVERY_DAY, isActive: true, completionCount: 3, lastCompletedDayKey: null, sortOrder: 0, createdAt: 0, exercises: true };
const log = [
  { id: '1', dayKey: 20251020, kind: 'workout', plan: 'A' },
  { id: '2', dayKey: 20261103, kind: 'workout', plan: 'B', text: 'Присідання з грифом 28,5 кг 4×20' },
  { id: '3', dayKey: 20261105, kind: 'run' },
  { id: '4', dayKey: 20260312, kind: 'workout', plan: 'A' },
];

const show = (data) => {
  const storage = memoryStorage({ data: { ...emptyData(), ...data }, settings: { lastExportAt: Date.now() / 1000 } });
  render(<OrganizerProvider storage={storage} today={TODAY}><TodayScreen onOpenSettings={() => {}} /></OrganizerProvider>);
};

beforeEach(() => vi.spyOn(window, 'scrollTo').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe('Statistics', () => {
  it('opens from Today and shows this year, with this month\'s days (positive)', async () => {
    show({ myTasks: [task], exerciseLog: log });
    await userEvent.click(await screen.findByRole('button', { name: 'Statistics' }));
    expect(screen.getByRole('heading', { name: 'Statistics' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2026' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Workouts').previousSibling).toHaveTextContent('2');
    expect(screen.getByText('Runs').previousSibling).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: 'November: 1 workout, 1 run' })).toHaveAttribute('aria-pressed', 'true');
    // Tapping a day shows what was done and its exercises
    await userEvent.click(screen.getByRole('button', { name: 'Tuesday 3 November: Day B' }));
    expect(screen.getByText('Присідання з грифом 28,5 кг 4×20')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
  });

  it('another month and another year can be picked (positive)', async () => {
    show({ myTasks: [task], exerciseLog: log });
    await userEvent.click(await screen.findByRole('button', { name: 'Statistics' }));
    await userEvent.click(screen.getByRole('button', { name: 'March: 1 workout, 0 runs' }));
    expect(screen.getByRole('heading', { name: 'March 2026' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '2025: 1 workout, 0 runs' }));
    expect(screen.getByRole('radio', { name: '2025' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('heading', { name: 'October 2025' })).toBeInTheDocument();
  });

  it('with no history it says how to start (negative)', async () => {
    show({ myTasks: [task], exerciseLog: [] });
    await userEvent.click(await screen.findByRole('button', { name: 'Statistics' }));
    expect(screen.getByText('No Runs or Workouts Yet')).toBeInTheDocument();
  });

  it('opens from the exercises sheet too (positive)', async () => {
    show({ myTasks: [task], exerciseLog: log });
    await userEvent.click(await screen.findByRole('button', { name: 'Exercises', pressed: false }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Statistics/ }));
    expect(screen.getByRole('heading', { name: 'Statistics' })).toBeInTheDocument();
  });
});
