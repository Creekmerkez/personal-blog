// Days are integers like 20261017 (yyyymmdd) in the phone's local calendar,
// never timestamps, so "today" and "+2 days" are immune to time-of-day and
// daylight-saving changes. Same rules as the iPhone app's DayKey.

// Backups store dates as seconds since 2001-01-01 UTC, the Swift default,
// so files move between this web app and the native app unchanged.
export const APPLE_EPOCH_MS = Date.UTC(2001, 0, 1);

export function dayKeyFromDate(date = new Date()) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

/** Noon local time on that day: a moment every day has, DST included. */
export function dateFromDayKey(key) {
  return new Date(Math.floor(key / 10000), (Math.floor(key / 100) % 100) - 1, key % 100, 12);
}

export function addDays(key, days) {
  const date = dateFromDayKey(key);
  date.setDate(date.getDate() + days);
  return dayKeyFromDate(date);
}

/** 1 = Sunday … 7 = Saturday. */
export function weekdayOf(key) {
  return dateFromDayKey(key).getDay() + 1;
}

export const appleSeconds = (date = new Date()) => (date.getTime() - APPLE_EPOCH_MS) / 1000;
export const dateFromAppleSeconds = (seconds) => new Date(APPLE_EPOCH_MS + seconds * 1000);

export function formatDay(key, options = { weekday: 'long', day: 'numeric', month: 'long' }) {
  return dateFromDayKey(key).toLocaleDateString('en-GB', options);
}

/** Milliseconds until the next local midnight, for the day-change timer. */
export function msUntilMidnight(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return next.getTime() - now.getTime();
}
