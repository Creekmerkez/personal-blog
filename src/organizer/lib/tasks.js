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
  return { ...task, completionCount: task.completionCount + 1, lastCompletedDayKey: today };
}

/** True when the task is scheduled on `day`. A one-time task (onceDayKey) appears on that day only. */
export function isScheduled(task, day) {
  if (task.onceDayKey != null) return task.onceDayKey === day;
  return includesDay(task.weekdayMask, day);
}

/** "Every day", "Mon, Wed, Fri", or "Once · Sat 17 Oct" for a one-time task. */
export function scheduleSummary(task, today) {
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
