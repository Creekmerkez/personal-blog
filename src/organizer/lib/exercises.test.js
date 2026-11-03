import { describe, it, expect } from 'vitest';
import { byYear, exerciseFileFrom, logRun, logWorkout, mergeLog, nextPlan, removeDay } from './exercises';
import { validateBackup } from './backup';

const plan = { id: 'A', title: 'Day A', items: ['Тумбочка 11 кг 4×15', 'Трицепс 17 кг 4×15'] };

describe('exercises', () => {
  it('alternates Day A and Day B from the last workout, Day A to start (positive)', () => {
    expect(nextPlan([])).toBe('A');
    let log = logWorkout([], plan, 20261103);
    expect(nextPlan(log)).toBe('B');
    log = logRun(log, 20261104); // a run doesn't change whose turn it is
    expect(nextPlan(log)).toBe('B');
    log = logWorkout(log, { ...plan, id: 'B' }, 20261105);
    expect(nextPlan(log)).toBe('A');
  });

  it('keeps the day\'s weights in the history, and one entry a day (positive)', () => {
    let log = logWorkout([], plan, 20261103);
    expect(log[0].text).toBe('Тумбочка 11 кг 4×15\nТрицепс 17 кг 4×15');
    log = logRun(log, 20261103);
    expect(log).toHaveLength(1);
    expect(removeDay(log, 20261103)).toEqual([]);
  });

  it('reads a history file and adds only days it doesn\'t have (positive and negative)', () => {
    const file = { format: 'organizer-exercise-log', version: 1, plans: [plan], entries: [
      { date: '2023-01-31', kind: 'workout', text: 'Сумо 20 кг' },
      { date: '2026-10-27', kind: 'workout', plan: 'B', text: 'Присідання з грифом 28,5 кг 4×20' },
    ] };
    const { entries, plans } = exerciseFileFrom(file);
    expect(entries.map((e) => e.dayKey)).toEqual([20230131, 20261027]);
    expect(plans).toHaveLength(1);
    const first = mergeLog([], entries);
    expect(first.added).toBe(2);
    expect(mergeLog(first.log, exerciseFileFrom(file).entries).added).toBe(0);
    expect(byYear(first.log).map((y) => [y.year, y.workouts, y.runs])).toEqual([[2026, 1, 0], [2023, 1, 0]]);
  });

  it('refuses other and damaged files (negative)', () => {
    expect(() => exerciseFileFrom({ format: 'organizer-journal-entries', entries: [] })).toThrow('not an exercise history file');
    expect(() => exerciseFileFrom({ format: 'organizer-exercise-log', version: 1, entries: [{ date: '31.01', kind: 'workout' }] })).toThrow('damaged');
    expect(() => validateBackup({ formatVersion: 1, exerciseLog: [{ kind: 'run' }] })).toThrow('damaged');
    expect(validateBackup({ formatVersion: 1 }).exerciseLog).toEqual([]);
  });
});
