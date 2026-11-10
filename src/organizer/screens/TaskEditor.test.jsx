import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskEditor from './TaskEditor';
import { EVERY_DAY } from '../lib/weekdays';

const task = (extra) => ({ id: 'T', name: 'Task', details: '', flag: 'green', weekdayMask: EVERY_DAY, isActive: true, completionCount: 1, lastCompletedDayKey: null, sortOrder: 0, createdAt: 0, ...extra });
const open = (t, offerExercises = false) => render(<TaskEditor task={t} sortOrder={0} offerExercises={offerExercises} onSave={() => {}} onDelete={() => {}} onClose={() => {}} />);

beforeEach(() => vi.spyOn(window, 'scrollTo').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe('TaskEditor', () => {
  it('shows the Run or workout switch on the exercises task (positive)', () => {
    open(task({ name: 'Workout and run', exercises: true }));
    expect(screen.getByRole('switch', { name: 'Run or workout' })).toBeChecked();
  });

  it('does not show it on any other task, new or existing (negative)', () => {
    open(task({ name: 'Vitamins' }));
    expect(screen.queryByRole('switch', { name: 'Run or workout' })).toBeNull();
  });

  it('shows it, switched off, while no task is the exercises task yet, so one can be chosen (positive)', () => {
    open(task({ name: 'Workout and run' }), true);
    expect(screen.getByRole('switch', { name: 'Run or workout' })).not.toBeChecked();
  });

  it('does not show it on a new task either (negative)', () => {
    open(null);
    expect(screen.queryByRole('switch', { name: 'Run or workout' })).toBeNull();
  });
});
