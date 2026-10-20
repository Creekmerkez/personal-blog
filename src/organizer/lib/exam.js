import { appleSeconds } from './dates';
import { newId } from './backup';
import { EXAM_TOPICS } from '../content/examTopics';

// Zkouška: exam topics to learn by heart, one sentence per line.
// practisedOn lists the days (yyyymmdd) a topic was practised.

export const sentences = (topic) => topic.text.split('\n').map((s) => s.trim()).filter(Boolean);

/** The owner's 20 topics, as editable entries of their own. */
export function starterTopics() {
  const created = appleSeconds();
  return EXAM_TOPICS.map((t, i) => ({ ...t, id: newId(), practisedOn: [], createdAt: created + i }));
}

export const byNumber = (topics) => [...topics].sort((a, b) => a.number - b.number);
export const practisedToday = (topic, today) => (topic.practisedOn ?? []).includes(today);
export const lastPractised = (topic) => ((topic.practisedOn ?? []).length ? Math.max(...topic.practisedOn) : null);
export const nextNumber = (topics) => Math.max(0, ...topics.map((t) => t.number)) + 1;

/** Today's topic: one not practised yet today, the longest unpractised first, then by number. */
export function topicForToday(topics, today) {
  const left = byNumber(topics.filter((t) => !practisedToday(t, today)));
  return left.sort((a, b) => (lastPractised(a) ?? 0) - (lastPractised(b) ?? 0))[0] ?? null;
}

/** Marks a topic practised today, or takes the mark back. */
export function togglePractised(topic, today) {
  const days = topic.practisedOn ?? [];
  return { ...topic, practisedOn: days.includes(today) ? days.filter((d) => d !== today) : [...days, today] };
}
