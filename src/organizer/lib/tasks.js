import { includesDay, summary } from './weekdays';
import { formatDay } from './dates';

// Same rules as the iPhone app. "Done today" is derived, never stored per day:
// a task is done when its last completed day is today (or later, after a
// westward time zone change). Check → uncheck → check on one day adds one.

export const isDone = (task, today) => task.lastCompletedDayKey != null && task.lastCompletedDayKey >= today;

export function toggleCompletion(task, today) {
  if (isDone(task, today)) {
    return { ...task, completionCount: Math.max(0, task.completionCount - 1), lastCompletedDayKey: null };
  }
  return { ...task, completionCount: task.completionCount + 1, lastCompletedDayKey: today, skippedDayKey: null };
}

// Skipping takes a task off today's To Do without counting it. Like done, it lasts until midnight.
export const isSkipped = (task, today) => task.skippedDayKey === today && !isDone(task, today);
export const skipToday = (task, today) => ({ ...task, skippedDayKey: today });
export const unskip = (task) => ({ ...task, skippedDayKey: null });

const lastDayOfMonth = (day) => new Date(Math.floor(day / 10000), Math.floor(day / 100) % 100, 0).getDate();

const ordinal = (n) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'}`;
};

/**
 * True when the task is scheduled on `day`. A one-time task (onceDayKey) appears on that day only.
 * A monthly task (monthDay 1–31) appears on that date each month, or on the last day of a shorter month.
 */
export function isScheduled(task, day) {
  if (task.onceDayKey != null) return task.onceDayKey === day;
  if (task.monthDay != null) return day % 100 === Math.min(task.monthDay, lastDayOfMonth(day));
  return includesDay(task.weekdayMask, day);
}

/** "Every day", "Mon, Wed, Fri", "Monthly · on the 1st", or "Once · Sat 17 Oct" for a one-time task. */
export function scheduleSummary(task, today) {
  if (task.monthDay != null) return `Monthly · on the ${ordinal(task.monthDay)}${task.monthDay > 28 ? ' (or the last day)' : ''}`;
  if (task.onceDayKey == null) return summary(task.weekdayMask);
  const when = formatDay(task.onceDayKey, { weekday: 'short', day: 'numeric', month: 'short' });
  return `Once · ${when}${today != null && task.onceDayKey < today ? ' (past)' : ''}`;
}

/** Active tasks scheduled for today: green first, then red, each in manual order. */
export function todayList(tasks, today) {
  return tasks
    .filter((task) => task.isActive && isScheduled(task, today))
    .sort((a, b) => {
      if (a.flag !== b.flag) return a.flag === 'green' ? -1 : 1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.createdAt - b.createdAt;
    });
}
