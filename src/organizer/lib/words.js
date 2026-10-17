// Word of the Day as a continuous rotation (the owner's rule):
// - A fixed number of words (default 20) goes round and round, one card after another.
// - "Remembered" sends the word to the end of the round. The third "Remembered"
//   marks it learned: it leaves the round and the next waiting word takes its place.
// - "Not remembered" starts its count over and brings it back after a few cards.
// - Learned words are kept, just out of the rotation. There is no daily limit
//   and no "nothing for today".
// queuePosition orders the words in the rotation; null means waiting or learned.
export const DEFAULT_ROTATION_SIZE = 20;
export const RECALLS_TO_LEARN = 3;
export const RETRY_AFTER = 5;

const hasTranslation = (w) => (w.translation ?? '').trim() !== '';
const inRotation = (w) => !w.isLearned && w.queuePosition != null;
const byPosition = (a, b) => a.queuePosition - b.queuePosition;
// Waiting words enter translated first (so cards are never blank), oldest first.
const waitingOrder = (a, b) => Number(hasTranslation(b)) - Number(hasTranslation(a)) || a.createdAt - b.createdAt;

/** The words going round right now, in order. Fills up to `size` from waiting words. */
export function rotation(words, size = DEFAULT_ROTATION_SIZE) {
  const current = words.filter(inRotation).sort(byPosition);
  const waiting = words.filter((w) => !w.isLearned && w.queuePosition == null).sort(waitingOrder);
  return [...current, ...waiting.slice(0, Math.max(0, size - current.length))];
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
  const order = rotation(words, size);
  if (order.length === 0) return words;
  const [word, ...rest] = order;
  const reviewed = { ...word, lastReviewedDayKey: today, firstReviewedDayKey: word.firstReviewedDayKey ?? today };
  let updated;
  let nextOrder;
  if (!remembered) {
    updated = { ...reviewed, successfulRecalls: 0 };
    const at = Math.min(RETRY_AFTER, rest.length);
    nextOrder = [...rest.slice(0, at), updated, ...rest.slice(at)];
  } else if (word.successfulRecalls + 1 >= RECALLS_TO_LEARN) {
    updated = { ...reviewed, successfulRecalls: word.successfulRecalls + 1, isLearned: true, queuePosition: null };
    nextOrder = rest;
  } else {
    updated = { ...reviewed, successfulRecalls: word.successfulRecalls + 1 };
    nextOrder = [...rest, updated];
  }
  const replaced = words.map((w) => (w.id === word.id ? updated : w));
  return withOrder(replaced, rotation(withOrder(replaced, nextOrder), size));
}

/** Back into learning: starts over, at the end of the current rotation. */
export function resetToLearning(word) {
  return { ...word, successfulRecalls: 0, isLearned: false, queuePosition: Number.MAX_SAFE_INTEGER };
}

export function counts(words, size = DEFAULT_ROTATION_SIZE) {
  const going = rotation(words, size).length;
  const learned = words.filter((w) => w.isLearned).length;
  return { going, learned, waiting: words.length - learned - going };
}
