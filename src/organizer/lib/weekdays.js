import { weekdayOf } from './dates';

// A schedule is a 7-bit mask: bit (weekday - 1), weekday 1 = Sunday … 7 = Saturday.
export const EVERY_DAY = 0b1111111;

const isWeekday = (day) => Number.isInteger(day) && day >= 1 && day <= 7;

export const contains = (mask, day) => isWeekday(day) && (mask & (1 << (day - 1))) !== 0;
export const includesDay = (mask, dayKey) => contains(mask, weekdayOf(dayKey));
export const fromWeekdays = (days) => days.reduce((mask, day) => (isWeekday(day) ? mask | (1 << (day - 1)) : mask), 0);
export const weekdaysOf = (mask) => [1, 2, 3, 4, 5, 6, 7].filter((day) => contains(mask, day));
export const toggleDay = (mask, day) => (isWeekday(day) ? (mask ^ (1 << (day - 1))) & EVERY_DAY : mask);
export const complement = (mask) => ~mask & EVERY_DAY;
export const countDays = (mask) => weekdaysOf(mask).length;

/** Monday first, as calendars are read in Europe. */
export const DISPLAY_ORDER = [2, 3, 4, 5, 6, 7, 1];

// 1 January 2023 was a Sunday, so day d of that month has weekday d.
const nameOf = (day, style) => new Date(2023, 0, day).toLocaleDateString('en-GB', { weekday: style });
export const shortName = (day) => nameOf(day, 'short');
export const longName = (day) => nameOf(day, 'long');

export function summary(mask) {
  const list = (m) => DISPLAY_ORDER.filter((d) => contains(m, d)).map(shortName).join(', ');
  const n = countDays(mask);
  if (n === 7) return 'Every day';
  if (n === 0) return 'Never';
  if (n === 1) return `Every ${longName(weekdaysOf(mask)[0])}`;
  if (n >= 5) {
    const skipped = complement(mask);
    return `Every day except ${countDays(skipped) === 1 ? longName(weekdaysOf(skipped)[0]) : list(skipped)}`;
  }
  return list(mask);
}

/** Editor state: three ways to say a schedule, saved as one mask. */
export function draftFromMask(mask) {
  if (mask === EVERY_DAY) return { mode: 'everyDay', onDays: 0, exceptDays: 0 };
  if (countDays(mask) >= 5) return { mode: 'exceptDays', onDays: mask, exceptDays: complement(mask) };
  return { mode: 'onDays', onDays: mask, exceptDays: 0 };
}

export function maskFromDraft(draft) {
  if (draft.mode === 'everyDay') return EVERY_DAY;
  if (draft.mode === 'onDays') return draft.onDays;
  return complement(draft.exceptDays);
}
