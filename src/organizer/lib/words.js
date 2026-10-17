import { addDays } from './dates';

// Fixed ladder, as in the iPhone app: 1st "remembered" → back in 2 days,
// 2nd → back in 3 days, 3rd → learned. "Not remembered" → back tomorrow,
// from the start. Learned words are kept, just out of the queue.
export const INTERVALS = [2, 3];
export const RECALLS_TO_LEARN = INTERVALS.length + 1;
export const DEFAULT_NEW_WORDS_PER_DAY = 5;

export const isNew = (word) => word.firstReviewedDayKey == null;

export function answer(word, remembered, today) {
  if (word.isLearned) return word;
  const next = {
    ...word,
    lastReviewedDayKey: today,
    firstReviewedDayKey: word.firstReviewedDayKey ?? today,
  };
  if (!remembered) {
    return { ...next, successfulRecalls: 0, nextReviewDayKey: addDays(today, 1) };
  }
  const recalls = word.successfulRecalls + 1;
  if (recalls >= RECALLS_TO_LEARN) return { ...next, successfulRecalls: recalls, isLearned: true };
  return { ...next, successfulRecalls: recalls, nextReviewDayKey: addDays(today, INTERVALS[recalls - 1]) };
}

export function resetToLearning(word, today) {
  return { ...word, successfulRecalls: 0, isLearned: false, nextReviewDayKey: today, firstReviewedDayKey: word.firstReviewedDayKey ?? today };
}

/** Due review words first (oldest due first), then today's share of new words. */
export function dueWords(words, today, newWordsPerDay = DEFAULT_NEW_WORDS_PER_DAY) {
  const active = words.filter((w) => !w.isLearned && w.nextReviewDayKey <= today);
  const reviews = active
    .filter((w) => !isNew(w))
    .sort((a, b) => a.nextReviewDayKey - b.nextReviewDayKey || a.createdAt - b.createdAt);
  const fresh = active.filter(isNew).sort((a, b) => a.createdAt - b.createdAt);
  const startedToday = words.filter((w) => w.firstReviewedDayKey === today).length;
  return [...reviews, ...fresh.slice(0, Math.max(0, newWordsPerDay - startedToday))];
}

export function nextDueDay(words, today) {
  const active = words.filter((w) => !w.isLearned);
  const candidates = active.filter((w) => w.nextReviewDayKey > today).map((w) => w.nextReviewDayKey);
  if (active.some((w) => isNew(w) && w.nextReviewDayKey <= today)) candidates.push(addDays(today, 1));
  return candidates.length ? Math.min(...candidates) : null;
}
