import { emptyData, newId } from './backup';
import { appleSeconds } from './dates';
import { EVERY_DAY, complement, fromWeekdays } from './weekdays';

/** Demo content for ?demo (screenshots). Lives in memory only. Generic on purpose: this file is public. */
export function sampleData(today) {
  const created = appleSeconds();
  const task = (name, completionCount, extra = {}) => ({
    id: newId(), name, details: '', flag: 'green', weekdayMask: EVERY_DAY, isActive: true,
    completionCount, lastCompletedDayKey: null, sortOrder: 0, createdAt: created, ...extra,
  });
  const tasks = [
    task('Morning walk', 41, { lastCompletedDayKey: today }),
    task('Vitamins', 87, { details: 'With breakfast', lastCompletedDayKey: today }),
    task('Yoga', 23, { weekdayMask: fromWeekdays([2, 4, 6]), details: '20 minutes, morning' }),
    task('Language practice', 64, { details: 'Textbook, one lesson with audio' }),
    task('Use new words', 12),
    task('Read 10 pages', 30, { weekdayMask: complement(fromWeekdays([1])), lastCompletedDayKey: today }),
    task('Workout', 200, { weekdayMask: fromWeekdays([2, 3, 4, 5, 6]), details: 'Warm-up\nStrength training\nStretching' }),
    task('Late-night scrolling', 13, { flag: 'red' }),
  ].map((t, i) => ({ ...t, sortOrder: i }));
  const word = (text, translation, notes, i) => ({
    id: newId(), word: text, translation, notes, successfulRecalls: 0, nextReviewDayKey: today,
    isLearned: false, createdAt: created + i,
  });
  return {
    ...emptyData(),
    myTasks: tasks,
    words: [
      word('přepadení', 'напад', '🇬🇧 attack, assault', 0),
      word('zhroutit se', 'обвалитися, зруйнуватися', '🇬🇧 to collapse', 1),
      word('výročí', 'річниця', '🇬🇧 anniversary', 2),
    ],
  };
}
