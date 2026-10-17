import { includesDay } from './weekdays';

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

/** Active tasks scheduled for today: green first, then red, each in manual order. */
export function todayList(tasks, today) {
  return tasks
    .filter((task) => task.isActive && includesDay(task.weekdayMask, today))
    .sort((a, b) => {
      if (a.flag !== b.flag) return a.flag === 'green' ? -1 : 1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.createdAt - b.createdAt;
    });
}
