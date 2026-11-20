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
const byOrder = (a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt;

/** Today's tasks in the owner's own order (she drags them into it on Today). */
export function todayList(tasks, today) {
  return tasks.filter((task) => task.isActive && isScheduled(task, today)).sort(byOrder);
}

/** sortOrder from 0, in the given order. */
const numbered = (tasks, ordered) => {
  const place = new Map(ordered.map((t, i) => [t.id, i]));
  return tasks.map((t) => ({ ...t, sortOrder: place.get(t.id) }));
};

/**
 * Today used to show green tasks first, then red ones. Before the order became entirely
 * the owner's, the tasks are numbered that way once, so nothing moves on screen.
 */
export const greenFirstOrder = (tasks) =>
  numbered(tasks, [...tasks].sort((a, b) => (a.flag === b.flag ? byOrder(a, b) : a.flag === 'green' ? -1 : 1)));

/**
 * A few tasks put in a new order (`ids`, e.g. today's To Do after a drag): they take the
 * places they had between them, so every other task stays where it was.
 */
export function reorderSome(tasks, ids) {
  const moved = new Set(ids);
  const byId = new Map(tasks.map((t) => [t.id, t]));
  let next = 0;
  const ordered = [...tasks].sort(byOrder).map((t) => (moved.has(t.id) ? byId.get(ids[next++]) : t));
  return numbered(tasks, ordered);
}
