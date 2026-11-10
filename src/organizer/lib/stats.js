import { dateFromDayKey, dayKeyFromDate } from './dates';
import { entryLabel } from './exercises';

// Workout statistics from the exercise history: per year, per month, per weekday,
// and the whole history as a CSV file for Excel or Google Sheets.

export const yearOf = (dayKey) => Math.floor(dayKey / 10000);
export const monthOf = (dayKey) => Math.floor(dayKey / 100) % 100; // 1…12

const count = (entries) => ({
  workouts: entries.filter((e) => e.kind === 'workout').length,
  runs: entries.filter((e) => e.kind === 'run').length,
});

/** The years with any entry, oldest first. */
export const yearsOf = (log) => [...new Set(log.map((e) => yearOf(e.dayKey)))].sort((a, b) => a - b);

/** Workouts and runs per year, oldest first. */
export const perYear = (log) => yearsOf(log).map((year) => ({ year, ...count(log.filter((e) => yearOf(e.dayKey) === year)) }));

/** Workouts and runs in each month of a year: 12 items, January first. */
export function perMonth(log, year) {
  const inYear = log.filter((e) => yearOf(e.dayKey) === year);
  return Array.from({ length: 12 }, (_, i) => ({ month: i + 1, ...count(inYear.filter((e) => monthOf(e.dayKey) === i + 1)) }));
}

/** Workouts and runs per weekday in a year, Monday first (0 = Monday … 6 = Sunday). */
export function perWeekday(log, year) {
  const inYear = log.filter((e) => yearOf(e.dayKey) === year);
  const weekday = (key) => (dateFromDayKey(key).getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => ({ weekday: i, ...count(inYear.filter((e) => weekday(e.dayKey) === i)) }));
}

const daysBetween = (from, to) => Math.round((dateFromDayKey(to) - dateFromDayKey(from)) / 86400000) + 1;

/**
 * Sessions per week in a year, counted from the first entry ever (if it falls in that year)
 * and up to today (if the year is the current one).
 */
export function perWeek(log, year, today) {
  const inYear = log.filter((e) => yearOf(e.dayKey) === year);
  if (!inYear.length) return 0;
  const first = Math.min(...log.map((e) => e.dayKey));
  const start = Math.max(year * 10000 + 101, first);
  const end = Math.min(year * 10000 + 1231, Math.max(today, ...inYear.map((e) => e.dayKey)));
  return inYear.length / Math.max(1, daysBetween(start, end) / 7);
}

/** The entries of one month, by day: Map(dayKey → entry). */
export function monthDays(log, year, month) {
  return new Map(log.filter((e) => yearOf(e.dayKey) === year && monthOf(e.dayKey) === month).map((e) => [e.dayKey, e]));
}

/** The month's days as calendar weeks (Monday first), with null for the blanks. */
export function monthGrid(year, month) {
  const first = new Date(year, month - 1, 1, 12);
  const days = new Date(year, month, 0, 12).getDate();
  const cells = Array((first.getDay() + 6) % 7).fill(null);
  for (let d = 1; d <= days; d += 1) cells.push(year * 10000 + month * 100 + d);
  while (cells.length % 7) cells.push(null);
  return cells;
}

const isoDate = (dayKey) => {
  const s = String(dayKey);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
};
const cell = (value) => (/[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value);

/** The whole history, oldest first, as CSV: Date, Type, Day, Exercises (one per line in the cell). */
export function historyCsv(log) {
  const rows = [...log]
    .sort((a, b) => a.dayKey - b.dayKey)
    .map((e) => [isoDate(e.dayKey), e.kind === 'run' ? 'Run' : 'Workout', e.kind === 'workout' && e.plan ? entryLabel(e) : '', e.text ?? '']);
  // The byte order mark tells Excel the file is UTF-8, so Cyrillic and Czech letters stay readable.
  return `\uFEFF${[['Date', 'Type', 'Day', 'Exercises'], ...rows].map((r) => r.map(cell).join(',')).join('\r\n')}\r\n`;
}

export const csvFileName = (today = dayKeyFromDate()) => `Exercise history ${today}.csv`;
