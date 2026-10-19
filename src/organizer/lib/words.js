import { addDays } from './dates';

// Word of the Day (the owner's rule):
// - A fixed number of words (default 20) goes round and round, one card after another.
// - "Remembered" sends the word to the end of the round. The third "Remembered"
//   in a row means it is remembered for now: it rests, out of the round, and comes
//   back on a later day to be remembered three times again.
// - Each rest is longer than the one before (REST_DAYS). Only a word remembered
//   again after the longest rest is learned and leaves for good.
// - "Not remembered", at any point, means it was only short-term memory: the word
//   starts over as if new — no count, no rests passed — and comes back after a few cards.
// - Learned words are kept, just out of the rotation.
// queuePosition orders the words in the round; null means waiting, resting or learned.
// nextReviewDayKey is the day a resting word comes back; rests counts the rests passed.
export const DEFAULT_ROTATION_SIZE = 20;
export const RECALLS_TO_LEARN = 3;
export const RETRY_AFTER = 5;
export const REST_DAYS = [1, 2, 4, 7, 14, 30];

const hasTranslation = (w) => (w.translation ?? '').trim() !== '';
const inRound = (w) => !w.isLearned && w.queuePosition != null;
const outOfRound = (w) => !w.isLearned && w.queuePosition == null;
const hasRested = (w) => (w.rests ?? 0) > 0;
export const isResting = (w, today) => outOfRound(w) && hasRested(w) && w.nextReviewDayKey > today;
const byPosition = (a, b) => a.queuePosition - b.queuePosition;
// Waiting words enter translated first (so cards are never blank), oldest first.
const waitingOrder = (a, b) => Number(hasTranslation(b)) - Number(hasTranslation(a)) || a.createdAt - b.createdAt;

/**
 * The words going round today, in order: the round itself, then words whose rest
 * is over (always, even past `size`), then new words up to `size`.
 */
export function rotation(words, size = DEFAULT_ROTATION_SIZE, today = Infinity) {
  const current = words.filter(inRound).sort(byPosition);
  const back = words
    .filter((w) => outOfRound(w) && hasRested(w) && w.nextReviewDayKey <= today)
    .sort((a, b) => a.nextReviewDayKey - b.nextReviewDayKey);
  const waiting = words.filter((w) => outOfRound(w) && !hasRested(w)).sort(waitingOrder);
  return [...current, ...back, ...waiting.slice(0, Math.max(0, size - current.length - back.length))];
}

function withOrder(words, order) {
  const position = new Map(order.map((w, i) => [w.id, i]));
  return words.map((w) => {
    if (position.has(w.id)) return { ...w, queuePosition: position.get(w.id) };
    return w.queuePosition != null && w.isLearned ? { ...w, queuePosition: null } : w;
  });
}

/** Applies an answer to the word at the front of the rotation and returns all words. */
export function answerCurrent(words, remembered, today, size = DEFAULT_ROTATION_SIZE) {
  const order = rotation(words, size, today);
  if (order.length === 0) return words;
  const [word, ...rest] = order;
  const reviewed = { ...word, lastReviewedDayKey: today, firstReviewedDayKey: word.firstReviewedDayKey ?? today };
  const recalls = word.successfulRecalls + 1;
  let updated;
  let nextOrder;
  if (!remembered) {
    updated = { ...reviewed, successfulRecalls: 0, rests: 0, nextReviewDayKey: today };
    const at = Math.min(RETRY_AFTER, rest.length);
    nextOrder = [...rest.slice(0, at), updated, ...rest.slice(at)];
  } else if (recalls < RECALLS_TO_LEARN) {
    updated = { ...reviewed, successfulRecalls: recalls };
    nextOrder = [...rest, updated];
  } else {
    const rests = word.rests ?? 0;
    updated = rests >= REST_DAYS.length
      ? { ...reviewed, successfulRecalls: recalls, isLearned: true, queuePosition: null }
      : { ...reviewed, successfulRecalls: 0, rests: rests + 1, nextReviewDayKey: addDays(today, REST_DAYS[rests]), queuePosition: null };
    nextOrder = rest;
  }
  const replaced = words.map((w) => (w.id === word.id ? updated : w));
  return withOrder(replaced, rotation(withOrder(replaced, nextOrder), size, today));
}

/** Back into learning: starts over, at the end of the current rotation. */
export function resetToLearning(word) {
  return { ...word, successfulRecalls: 0, rests: 0, isLearned: false, queuePosition: Number.MAX_SAFE_INTEGER };
}

export function counts(words, size = DEFAULT_ROTATION_SIZE, today = Infinity) {
  const going = rotation(words, size, today).length;
  const learned = words.filter((w) => w.isLearned).length;
  const resting = words.filter((w) => isResting(w, today)).length;
  return { going, learned, resting, waiting: words.length - learned - going - resting };
}

/** The day the next resting word comes back, or null. */
export function nextReturn(words, today) {
  const days = words.filter((w) => isResting(w, today)).map((w) => w.nextReviewDayKey);
  return days.length ? Math.min(...days) : null;
}
