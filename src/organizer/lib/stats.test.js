import { describe, it, expect } from 'vitest';
import { historyCsv, monthGrid, perMonth, perWeek, perWeekday, perYear, yearsOf } from './stats';

const log = [
  { id: '1', dayKey: 20250106, kind: 'workout', plan: 'A', text: 'Тумбочка 11 кг 4×15\nPlank, 3 sets' }, // Monday
  { id: '2', dayKey: 20250108, kind: 'run' }, // Wednesday
  { id: '3', dayKey: 20250313, kind: 'workout', plan: 'B' }, // Thursday
  { id: '4', dayKey: 20261102, kind: 'run' }, // Monday
];

describe('workout statistics', () => {
  it('counts per year, oldest first (positive)', () => {
    expect(yearsOf(log)).toEqual([2025, 2026]);
    expect(perYear(log)).toEqual([{ year: 2025, workouts: 2, runs: 1 }, { year: 2026, workouts: 0, runs: 1 }]);
  });

  it('counts per month, 12 months with the empty ones at zero (positive)', () => {
    const months = perMonth(log, 2025);
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ month: 1, workouts: 1, runs: 1 });
    expect(months[2]).toEqual({ month: 3, workouts: 1, runs: 0 });
    expect(months[11]).toEqual({ month: 12, workouts: 0, runs: 0 });
  });

  it('counts per weekday, Monday first (positive)', () => {
    const days = perWeekday(log, 2025);
    expect(days[0]).toEqual({ weekday: 0, workouts: 1, runs: 0 });
    expect(days[2]).toEqual({ weekday: 2, workouts: 0, runs: 1 });
    expect(days[3]).toEqual({ weekday: 3, workouts: 1, runs: 0 });
    expect(days[6]).toEqual({ weekday: 6, workouts: 0, runs: 0 });
  });

  it('a week average counts from the first entry and up to today (positive)', () => {
    // 2025: from 6 Jan to 31 Dec is 360 days, 3 sessions
    expect(perWeek(log, 2025, 20261110)).toBeCloseTo(3 / (360 / 7));
    // 2026: 1 Jan to today, 10 Nov, is 314 days
    expect(perWeek(log, 2026, 20261110)).toBeCloseTo(1 / (314 / 7));
  });

  it('a year with nothing averages zero (negative)', () => {
    expect(perWeek(log, 2024, 20261110)).toBe(0);
    expect(perYear([])).toEqual([]);
  });

  it('lays a month out in weeks from Monday (positive)', () => {
    const cells = monthGrid(2026, 11); // 1 November 2026 is a Sunday
    expect(cells.slice(0, 7)).toEqual([null, null, null, null, null, null, 20261101]);
    expect(cells.length % 7).toBe(0);
    expect(cells.filter(Boolean)).toHaveLength(30);
  });

  it('exports CSV for Excel: UTF-8 mark, oldest first, quoted multi-line exercises (positive)', () => {
    const lines = historyCsv([...log].reverse()).split('\r\n');
    expect(lines[0]).toBe('﻿Date,Type,Day,Exercises');
    expect(lines[1]).toBe('2025-01-06,Workout,Day A,"Тумбочка 11 кг 4×15\nPlank, 3 sets"');
    expect(lines[2]).toBe('2025-01-08,Run,,');
    expect(lines[3]).toBe('2025-03-13,Workout,Day B,');
    expect(lines[4]).toBe('2026-11-02,Run,,');
  });

  it('escapes quotes inside a cell (negative)', () => {
    expect(historyCsv([{ id: 'q', dayKey: 20260101, kind: 'workout', text: 'Bar "Olympic"' }])).toContain('2026-01-01,Workout,,"Bar ""Olympic"""');
  });
});
