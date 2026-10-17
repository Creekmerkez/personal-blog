import { describe, it, expect } from 'vitest';
import { addDays, appleSeconds, dateFromAppleSeconds, dayKeyFromDate, weekdayOf } from './dates';
import { complement, draftFromMask, EVERY_DAY, fromWeekdays, includesDay, maskFromDraft, summary, toggleDay } from './weekdays';
import { isDone, todayList, toggleCompletion } from './tasks';
import { answer, dueWords, nextDueDay } from './words';

describe('dates', () => {
  it('builds day keys from local dates and adds days across month, year and leap day (positive)', () => {
    expect(dayKeyFromDate(new Date(2026, 9, 17, 23, 59))).toBe(20261017);
    expect(addDays(20261231, 1)).toBe(20270101);
    expect(addDays(20280228, 1)).toBe(20280229);
    expect(addDays(20260301, -1)).toBe(20260228);
    expect(addDays(20261024, 2)).toBe(20261026); // across the October clock change
  });

  it('numbers weekdays with Sunday as 1', () => {
    expect(weekdayOf(20260929)).toBe(3); // Tuesday
    expect(weekdayOf(20261004)).toBe(1); // Sunday
    expect(weekdayOf(20261003)).toBe(7); // Saturday
  });

  it('converts to and from the iPhone app date format', () => {
    const date = new Date(Date.UTC(2026, 9, 17, 10, 0, 0));
    expect(dateFromAppleSeconds(appleSeconds(date)).getTime()).toBe(date.getTime());
    expect(appleSeconds(new Date(Date.UTC(2001, 0, 1)))).toBe(0);
  });
});

describe('weekday schedules', () => {
  const week = [20260927, 20260928, 20260929, 20260930, 20261001, 20261002, 20261003]; // Sun … Sat
  const visible = (mask) => week.filter((day) => includesDay(mask, day)).map(weekdayOf);

  it('every day, chosen days, one day and every day except', () => {
    expect(visible(EVERY_DAY)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(visible(fromWeekdays([2, 4, 6]))).toEqual([2, 4, 6]);
    expect(visible(fromWeekdays([7]))).toEqual([7]);
    expect(visible(complement(fromWeekdays([1])))).toEqual([2, 3, 4, 5, 6, 7]);
  });

  it('ignores invalid weekdays (negative)', () => {
    expect(fromWeekdays([0, 8, -1, 3])).toBe(fromWeekdays([3]));
    expect(toggleDay(0, 9)).toBe(0);
    expect(visible(0)).toEqual([]);
  });

  it('reads like the iPhone app', () => {
    expect(summary(EVERY_DAY)).toBe('Every day');
    expect(summary(fromWeekdays([2, 4, 6]))).toBe('Mon, Wed, Fri');
    expect(summary(fromWeekdays([7]))).toBe('Every Saturday');
    expect(summary(complement(fromWeekdays([1])))).toBe('Every day except Sunday');
    expect(summary(complement(fromWeekdays([1, 7])))).toBe('Every day except Sat, Sun');
  });

  it('editor modes save back the same schedule, and an empty one is impossible to miss', () => {
    for (const mask of [EVERY_DAY, fromWeekdays([2, 4, 6]), fromWeekdays([7]), complement(fromWeekdays([1]))]) {
      expect(maskFromDraft(draftFromMask(mask))).toBe(mask);
    }
    expect(maskFromDraft({ mode: 'onDays', onDays: 0, exceptDays: 0 })).toBe(0);
    expect(maskFromDraft({ mode: 'exceptDays', onDays: 0, exceptDays: EVERY_DAY })).toBe(0);
  });
});

describe('daily tasks', () => {
  const task = (extra = {}) => ({ id: 'a', name: 'Workout', flag: 'green', weekdayMask: EVERY_DAY, isActive: true, completionCount: 200, lastCompletedDayKey: null, sortOrder: 0, createdAt: 0, ...extra });

  it('check, uncheck, check on one day counts once (positive)', () => {
    let t = task();
    t = toggleCompletion(t, 20260912);
    expect(t.completionCount).toBe(201);
    t = toggleCompletion(t, 20260912);
    expect(t.completionCount).toBe(200);
    t = toggleCompletion(t, 20260912);
    expect(t.completionCount).toBe(201);
    expect(isDone(t, 20260912)).toBe(true);
  });

  it('a new day clears the checkbox and keeps the counter', () => {
    const t = task({ completionCount: 201, lastCompletedDayKey: 20260912 });
    expect(isDone(t, 20260913)).toBe(false);
    expect(toggleCompletion(t, 20260913).completionCount).toBe(202);
  });

  it('never goes below zero, and a stored day ahead of today still reads as done (negative)', () => {
    expect(toggleCompletion(task({ completionCount: 0, lastCompletedDayKey: 20260912 }), 20260912).completionCount).toBe(0);
    expect(isDone(task({ lastCompletedDayKey: 20260913 }), 20260912)).toBe(true);
  });

  it('shows only active tasks for today, green first, each in manual order', () => {
    const tasks = [
      task({ id: '1', name: 'Alcohol', flag: 'red', sortOrder: 0 }),
      task({ id: '2', name: 'Reading', sortOrder: 3 }),
      task({ id: '3', name: 'Mondays', weekdayMask: fromWeekdays([2]), sortOrder: 1 }),
      task({ id: '4', name: 'Paused', isActive: false, sortOrder: 2 }),
      task({ id: '5', name: 'Workout', sortOrder: 2 }),
    ];
    expect(todayList(tasks, 20260929).map((t) => t.name)).toEqual(['Workout', 'Reading', 'Alcohol']);
  });
});

describe('word of the day', () => {
  const word = (name, extra = {}) => ({ word: name, translation: '-', successfulRecalls: 0, nextReviewDayKey: 20260929, isLearned: false, createdAt: 0, ...extra });

  it('2 days, then 3 days, then learned; not remembered starts over tomorrow', () => {
    let w = answer(word('dům'), true, 20260929);
    expect(w.nextReviewDayKey).toBe(20261001);
    w = answer(w, true, 20261001);
    expect(w.nextReviewDayKey).toBe(20261004);
    w = answer(w, true, 20261004);
    expect(w.isLearned).toBe(true);
    const forgotten = answer(answer(word('les'), true, 20260929), false, 20261001);
    expect(forgotten.successfulRecalls).toBe(0);
    expect(forgotten.nextReviewDayKey).toBe(20261002);
  });

  it('a few new words per day, reviews always, and tomorrow when new words wait', () => {
    const words = [
      ...Array.from({ length: 8 }, (_, i) => word(`new ${i}`, { createdAt: i })),
      word('review', { firstReviewedDayKey: 20260901, createdAt: 100 }),
      word('learned', { isLearned: true }),
    ];
    expect(dueWords(words, 20260929, 5).map((w) => w.word)).toEqual(['review', 'new 0', 'new 1', 'new 2', 'new 3', 'new 4']);
    const started = words.map((w, i) => (i < 5 ? answer(w, true, 20260929) : w));
    expect(dueWords(started, 20260929, 5).map((w) => w.word)).toEqual(['review']);
    expect(nextDueDay(started.filter((w) => w.word !== 'review'), 20260929)).toBe(20260930);
  });
});
