import { describe, it, expect } from 'vitest';
import { addDays, appleSeconds, dateFromAppleSeconds, dayKeyFromDate, weekdayOf } from './dates';
import { complement, draftFromMask, EVERY_DAY, fromWeekdays, includesDay, maskFromDraft, summary, toggleDay } from './weekdays';
import { isDone, isSkipped, scheduleSummary, skipToday, todayList, toggleCompletion, unskip } from './tasks';
import { answerCurrent, counts, nextReturn, resetToLearning, REST_DAYS, rotation, RETRY_AFTER } from './words';

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

  it('skipping takes a task off today without counting it, until midnight', () => {
    const shave = skipToday(task({ name: 'Face shaving', completionCount: 10 }), 20261017);
    expect(isSkipped(shave, 20261017)).toBe(true);
    expect(isDone(shave, 20261017)).toBe(false);
    expect(shave.completionCount).toBe(10);
    expect(isSkipped(shave, 20261018)).toBe(false); // back on To Do tomorrow
    expect(isSkipped(unskip(shave), 20261017)).toBe(false);
    const didItAfterAll = toggleCompletion(shave, 20261017);
    expect(didItAfterAll.completionCount).toBe(11);
    expect(isSkipped(didItAfterAll, 20261017)).toBe(false);
    expect(isSkipped(toggleCompletion(didItAfterAll, 20261017), 20261017)).toBe(false); // unchecking returns it to To Do
  });

  it('a one-time task shows on its day only, never the next day', () => {
    const once = task({ id: 'o', name: 'Print car documents', onceDayKey: 20261017, weekdayMask: fromWeekdays([7]) });
    expect(todayList([once], 20261017).map((t) => t.name)).toEqual(['Print car documents']);
    expect(todayList([once], 20261018)).toEqual([]);
    expect(todayList([once], 20261024)).toEqual([]); // same weekday a week later: still not shown
    expect(scheduleSummary(once, 20261017)).toBe('Once · Sat 17 Oct');
    expect(scheduleSummary(once, 20261018)).toBe('Once · Sat 17 Oct (past)');
    expect(maskFromDraft({ mode: 'once', onceDay: 20261017 })).toBe(fromWeekdays([7]));
  });

  it('a monthly task shows on its date each month, or on the last day of a shorter month', () => {
    const sheets = task({ id: 'm', name: 'Wash bed linen', monthDay: 1 });
    expect(todayList([sheets], 20261101).map((t) => t.name)).toEqual(['Wash bed linen']);
    expect(todayList([sheets], 20270101)).toHaveLength(1);
    expect(todayList([sheets], 20261102)).toEqual([]);
    const late = task({ id: 'l', monthDay: 31 });
    expect(todayList([late], 20261031)).toHaveLength(1);
    expect(todayList([late], 20261130)).toHaveLength(1); // November has 30 days
    expect(todayList([late], 20270228)).toHaveLength(1);
    expect(todayList([late], 20270227)).toEqual([]);
    expect(scheduleSummary(sheets)).toBe('Monthly · on the 1st');
    expect(scheduleSummary(task({ monthDay: 22 }))).toBe('Monthly · on the 22nd');
    expect(scheduleSummary(task({ monthDay: 11 }))).toBe('Monthly · on the 11th');
    expect(scheduleSummary(late)).toBe('Monthly · on the 31st (or the last day)');
    expect(maskFromDraft({ mode: 'monthly', monthDay: 1 })).toBe(EVERY_DAY);
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

describe('word of the day rotation', () => {
  let n = 0;
  const word = (name, extra = {}) => ({ id: `w${n++}`, word: name, translation: 'x', successfulRecalls: 0, nextReviewDayKey: 0, isLearned: false, createdAt: n, ...extra });
  const names = (words, size) => rotation(words, size).map((w) => w.word);

  it('keeps a fixed number of words going round, never "nothing today" (positive)', () => {
    let words = Array.from({ length: 30 }, (_, i) => word(`w${i}`));
    expect(rotation(words, 20)).toHaveLength(20);
    for (let i = 0; i < 100; i++) words = answerCurrent(words, i % 2 === 0, 20261017, 20);
    expect(rotation(words, 20).length).toBeGreaterThan(0);
  });

  it('remembered goes to the end of the round', () => {
    let words = ['a', 'b', 'c'].map((x) => word(x));
    words = answerCurrent(words, true, 20261017, 3);
    expect(names(words, 3)).toEqual(['b', 'c', 'a']);
  });

  const TODAY = 20261017;
  // Answers the card for `name` (others in front are remembered, on the same day).
  const answerWord = (words, name, remembered, today = TODAY, size = 2) => {
    let w = words;
    for (let i = 0; i < 50 && rotation(w, size, today)[0]?.word !== name; i++) w = answerCurrent(w, true, today, size);
    return answerCurrent(w, remembered, today, size);
  };
  const thrice = (words, name, today, size) => [1, 2, 3].reduce((w) => answerWord(w, name, true, today, size), words);

  it('three remembered in a row rest the word for a day, and the next waiting word takes its place', () => {
    let words = ['a', 'b', 'c'].map((x) => word(x));
    words = thrice(words, 'a', TODAY, 2);
    const a = words.find((w) => w.word === 'a');
    expect(a).toMatchObject({ isLearned: false, successfulRecalls: 0, rests: 1, nextReviewDayKey: 20261018 });
    expect(rotation(words, 2, TODAY).map((w) => w.word)).toEqual(['b', 'c']);
    expect(counts(words, 2, TODAY)).toMatchObject({ resting: 1, learned: 0 });
    expect(nextReturn(words, TODAY)).toBe(20261018);
    // Back the next day, ahead of new words, to be remembered three times again
    expect(rotation(words, 2, 20261018).map((w) => w.word)).toContain('a');
  });

  it('rests grow 1, 2, 4, 7, 14, 30 days; remembered after the 30-day rest it is learned', () => {
    let words = [word('a'), word('b')];
    let day = TODAY;
    for (const restDays of REST_DAYS) {
      words = thrice(words, 'a', day, 1);
      const a = words.find((w) => w.word === 'a');
      expect(a.nextReviewDayKey).toBe(addDays(day, restDays));
      expect(rotation(words, 1, day).map((w) => w.word)).not.toContain('a');
      day = a.nextReviewDayKey;
    }
    words = thrice(words, 'a', day, 1);
    expect(words.find((w) => w.word === 'a').isLearned).toBe(true);
  });

  it('not remembered after rests starts the word over as if new (negative)', () => {
    let words = [word('a'), word('b'), word('c')];
    words = thrice(words, 'a', TODAY, 3);
    words = thrice(words, 'a', 20261018, 3);
    expect(words.find((w) => w.word === 'a').rests).toBe(2);
    words = answerWord(words, 'a', true, 20261020, 3);
    words = answerWord(words, 'a', false, 20261020, 3);
    const a = words.find((w) => w.word === 'a');
    expect(a).toMatchObject({ successfulRecalls: 0, rests: 0, nextReviewDayKey: 20261020, isLearned: false });
    expect(rotation(words, 3, 20261020).map((w) => w.word)).toContain('a');
  });

  it('words back from a rest come even when the round is full', () => {
    const back = word('back', { rests: 2, nextReviewDayKey: TODAY });
    const resting = word('later', { rests: 1, nextReviewDayKey: TODAY + 1 });
    const words = [word('a', { queuePosition: 0 }), word('b', { queuePosition: 1 }), back, resting, word('new')];
    expect(rotation(words, 2, TODAY).map((w) => w.word)).toEqual(['a', 'b', 'back']);
    expect(counts(words, 2, TODAY)).toEqual({ going: 3, learned: 0, resting: 1, waiting: 1 });
  });

  it('not remembered starts over and comes back after a few cards, not a whole round', () => {
    let words = Array.from({ length: 20 }, (_, i) => word(`w${i}`));
    words = answerCurrent(words, true, 20261017, 20);
    const first = rotation(words, 20)[0].word;
    words = answerCurrent(words, false, 20261017, 20);
    expect(names(words, 20).indexOf(first)).toBe(RETRY_AFTER);
    expect(words.find((w) => w.word === first).successfulRecalls).toBe(0);
  });

  it('waiting words with a translation come first, and learned words are kept (negative)', () => {
    const words = [word('Captivating', { translation: '' }), word('dům', { translation: 'дім' }), word('old', { isLearned: true })];
    expect(names(words, 1)).toEqual(['dům']);
    expect(words).toHaveLength(3);
    expect(names([word('only learned', { isLearned: true })], 20)).toEqual([]);
  });

  it('learn again puts a learned word back into the round', () => {
    const learned = word('les', { isLearned: true, successfulRecalls: 3 });
    const words = [word('a'), resetToLearning(learned)];
    expect(rotation(words, 20).map((w) => w.word)).toContain('les');
    expect(words[1].successfulRecalls).toBe(0);
  });
});
