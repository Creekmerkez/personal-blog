import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizerProvider } from '../lib/OrganizerProvider';
import { memoryStorage } from '../lib/storage';
import { emptyData } from '../lib/backup';
import { EVERY_DAY } from '../lib/weekdays';
import TodayScreen from './TodayScreen';

const TODAY = 20261103;
const task = (extra) => ({ id: 'T1', name: 'Exercises', details: '', flag: 'green', weekdayMask: EVERY_DAY, isActive: true, completionCount: 5, lastCompletedDayKey: null, sortOrder: 0, createdAt: 0, ...extra });
const plans = [
  { id: 'A', title: 'Day A', items: ['Тумбочка 11 кг 4×15'] },
  { id: 'B', title: 'Day B', items: ['Присідання з грифом 28,5 кг 4×20'] },
];

const show = (data) => {
  const storage = memoryStorage({ data: { ...emptyData(), ...data }, settings: { lastExportAt: Date.now() / 1000 } });
  render(<OrganizerProvider storage={storage} today={TODAY}><TodayScreen onOpenSettings={() => {}} /></OrganizerProvider>);
  return storage;
};

beforeEach(() => vi.spyOn(window, 'scrollTo').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe('Exercises on Today', () => {
  it('checking asks run or workout; a workout shows today\'s plan and counts the day (positive)', async () => {
    const storage = show({ myTasks: [task({ exercises: true })], exercisePlans: plans, exerciseLog: [{ id: 'x', dayKey: 20261027, kind: 'workout', plan: 'B' }] });
    await userEvent.click(await screen.findByRole('button', { name: 'Exercises', pressed: false }));
    await userEvent.click(screen.getByRole('button', { name: /^Workout/ }));
    // Day A's turn comes selected, and its exercises show
    expect(screen.getByRole('radio', { name: 'Day A' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Тумбочка 11 кг 4×15')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Done · Day A' }));
    await userEvent.click(screen.getByRole('radio', { name: /^Done/ }));
    expect(screen.getByRole('button', { name: 'Exercises', pressed: true })).toBeInTheDocument();
    const saved = await storage.get('data');
    expect(saved.myTasks[0].completionCount).toBe(6);
    expect(saved.exerciseLog.at(-1)).toMatchObject({ dayKey: TODAY, kind: 'workout', plan: 'A', text: 'Тумбочка 11 кг 4×15' });
  });

  it('a run is one tap; unchecking takes the day back out of the history (positive)', async () => {
    const storage = show({ myTasks: [task({ exercises: true })], exercisePlans: plans });
    await userEvent.click(await screen.findByRole('button', { name: 'Exercises', pressed: false }));
    await userEvent.click(screen.getByRole('button', { name: /^Run/ }));
    expect((await storage.get('data')).exerciseLog).toMatchObject([{ dayKey: TODAY, kind: 'run' }]);
    await userEvent.click(screen.getByRole('radio', { name: /^Done/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Exercises', pressed: true }));
    expect((await storage.get('data')).exerciseLog).toEqual([]);
  });

  it('tapping the task\'s name opens the same sheet, and Day B can be chosen instead (positive)', async () => {
    const storage = show({ myTasks: [task({ exercises: true })], exercisePlans: plans });
    await userEvent.click(await screen.findByText('Exercises'));
    await userEvent.click(screen.getByRole('button', { name: /^Workout/ }));
    await userEvent.click(screen.getByRole('radio', { name: 'Day B' }));
    expect(screen.getByText('Присідання з грифом 28,5 кг 4×20')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Done · Day B' }));
    expect((await storage.get('data')).exerciseLog).toMatchObject([{ dayKey: TODAY, plan: 'B' }]);
  });

  it('an ordinary task is still checked straight away, without asking (negative)', async () => {
    show({ myTasks: [task({ name: 'Vitamins' })] });
    await userEvent.click(await screen.findByRole('button', { name: 'Vitamins', pressed: false }));
    expect(screen.queryByText(/Workout ·/)).toBeNull();
    await userEvent.click(screen.getByRole('radio', { name: /^Done/ }));
    expect(screen.getByRole('button', { name: 'Vitamins', pressed: true })).toBeInTheDocument();
  });
});

describe('Choosing the exercises task', () => {
  it('offers the switch on every task until one has it, then only on that one (positive and negative)', async () => {
    show({ myTasks: [task({ id: 'T1', name: 'Workout and run' }), task({ id: 'T2', name: 'Vitamins', sortOrder: 1 })] });
    await userEvent.click(await screen.findByText('Workout and run'));
    await userEvent.click(screen.getByRole('switch', { name: 'Run or workout' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await userEvent.click(screen.getByText('Vitamins'));
    expect(screen.queryByRole('switch', { name: 'Run or workout' })).toBeNull();
  });
});
