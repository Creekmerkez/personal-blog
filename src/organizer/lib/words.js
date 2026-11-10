import { addDays } from './dates';

// Word of the Day (the owner's rule):
// - A fixed number of words (default 20) goes round and round, one card after another.
// - "Remembered" sends the word to the end of the round. The third "Remembered"
//   in a row puts it away for a week.
// - After that week it comes back once, as a check: "Remembered" and it is learned.
//   "Not remembered" puts it away for another week; failed at that second check, for
//   a month; failed after the month as well, it starts over in the round as if new.
// - "Not remembered" while still in the round means it was only short-term memory:
//   the count starts over and the word comes back after a few cards.
// - Learned words are kept, just out of the rotation.
// queuePosition orders the words in the round; null means waiting, away or learned.
// nextReviewDayKey is the day a word that is away comes back; checks is the check it
// is on (1 and 2: after a week, 3: after a month), 0 while it is learned in the round.
export const DEFAULT_ROTATION_SIZE = 20;
export const RECALLS_TO_LEARN = 3;
export const RETRY_AFTER = 5;
export const CHECK_DAYS = [7, 7, 30]; // away before check 1, 2 and 3

const hasTranslation = (w) => (w.translation ?? '').trim() !== '';
const inRound = (w) => !w.isLearned && w.queuePosition != null;
const outOfRound = (w) => !w.isLearned && w.queuePosition == null;
export const isCheck = (w) => (w.checks ?? 0) > 0;
export const isResting = (w, today) => outOfRound(w) && isCheck(w) && w.nextReviewDayKey > today;
const byPosition = (a, b) => a.queuePosition - b.queuePosition;
// Waiting words enter translated first (so cards are never blank), oldest first.
const waitingOrder = (a, b) => Number(hasTranslation(b)) - Number(hasTranslation(a)) || a.createdAt - b.createdAt;

/**
 * The words going round today, in order: the round itself, then words due for their
 * check (always, even past `size`), then new words up to `size`.
 */
export function rotation(words, size = DEFAULT_ROTATION_SIZE, today = Infinity) {
  const current = words.filter(inRound).sort(byPosition);
  const back = words
    .filter((w) => outOfRound(w) && isCheck(w) && w.nextReviewDayKey <= today)
    .sort((a, b) => a.nextReviewDayKey - b.nextReviewDayKey);
  const waiting = words.filter((w) => outOfRound(w) && !isCheck(w)).sort(waitingOrder);
  return [...current, ...back, ...waiting.slice(0, Math.max(0, size - current.length - back.length))];
}

function withOrder(words, order) {
  const position = new Map(order.map((w, i) => [w.id, i]));
  return words.map((w) => {
    if (position.has(w.id)) return { ...w, queuePosition: position.get(w.id) };
    return w.queuePosition != null && w.isLearned ? { ...w, queuePosition: null } : w;
  });
}

const awayFor = (word, checks, today) => ({ ...word, successfulRecalls: 0, checks, nextReviewDayKey: addDays(today, CHECK_DAYS[checks - 1]), queuePosition: null });

/** Applies an answer to the word at the front of the rotation and returns all words. */
export function answerCurrent(words, remembered, today, size = DEFAULT_ROTATION_SIZE) {
  const order = rotation(words, size, today);
  if (order.length === 0) return words;
  const [word, ...rest] = order;
  const reviewed = { ...word, lastReviewedDayKey: today, firstReviewedDayKey: word.firstReviewedDayKey ?? today };
  const checks = word.checks ?? 0;
  const startOver = () => {
    const updated = { ...reviewed, successfulRecalls: 0, checks: 0, nextReviewDayKey: today };
    const at = Math.min(RETRY_AFTER, rest.length);
    return [updated, [...rest.slice(0, at), updated, ...rest.slice(at)]];
  };
  let updated;
  let nextOrder;
  if (checks > 0) {
    // A check: one answer decides.
    if (remembered) [updated, nextOrder] = [{ ...reviewed, isLearned: true, queuePosition: null }, rest];
    else if (checks < CHECK_DAYS.length) [updated, nextOrder] = [awayFor(reviewed, checks + 1, today), rest];
    else [updated, nextOrder] = startOver();
  } else if (!remembered) {
    [updated, nextOrder] = startOver();
  } else if (word.successfulRecalls + 1 < RECALLS_TO_LEARN) {
    updated = { ...reviewed, successfulRecalls: word.successfulRecalls + 1 };
    nextOrder = [...rest, updated];
  } else {
    [updated, nextOrder] = [awayFor(reviewed, 1, today), rest];
  }
  const replaced = words.map((w) => (w.id === word.id ? updated : w));
  return withOrder(replaced, rotation(withOrder(replaced, nextOrder), size, today));
}

/**
 * Words from the earlier rule, which counted rests instead of checks: a word that was
 * remembered three times in a row again after a rest has passed its check, so it is
 * learned; one rest means its check is still to come. Returns the same array when
 * there is nothing to change.
 */
export function migrateWords(words) {
  if (!words.some((w) => 'rests' in w)) return words;
  return words.map((w) => {
    if (!('rests' in w)) return w;
    const { rests, ...word } = w;
    if (word.isLearned) return word;
    if (rests >= 2) return { ...word, isLearned: true, queuePosition: null };
    if (rests !== 1) return { ...word, checks: 0 };
    // Away until a week after it was last remembered three times, as the rule now says.
    const away = word.queuePosition == null && word.lastReviewedDayKey;
    return { ...word, checks: 1, ...(away ? { nextReviewDayKey: addDays(word.lastReviewedDayKey, CHECK_DAYS[0]) } : {}) };
  });
}

/** Back into learning: starts over, at the end of the current rotation. */
export function resetToLearning(word) {
  return { ...word, successfulRecalls: 0, checks: 0, isLearned: false, queuePosition: Number.MAX_SAFE_INTEGER };
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
