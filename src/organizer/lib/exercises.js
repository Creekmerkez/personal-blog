import { dateFromDayKey } from './dates';
import { newId } from './backup';

// Exercises: a task marked "Run or workout" asks, when checked, which one it was.
// Workouts alternate between two plans, Day A and Day B; the next one is always the
// other plan from the last workout. Every run and workout goes into the history.
//
// exercisePlans: [{ id: 'A' | 'B', title, items: ['Тумбочка 11 кг 4×15', …] }]
// exerciseLog:   [{ id, dayKey, kind: 'run' | 'workout', plan?: 'A' | 'B', text? }]
// A workout keeps the plan's text as it was that day, so the weights in the history stay true.

export const EXERCISE_FILE_FORMAT = 'organizer-exercise-log';
export const isExerciseFile = (value) => value?.format === EXERCISE_FILE_FORMAT;
export const PLAN_IDS = ['A', 'B'];
export const planTitle = (id) => (id === 'B' ? 'Day B' : 'Day A');

const dayKeyFromIso = (iso) => Number(iso.replaceAll('-', ''));

/** History entries (and plans, if any) from a history file. Throws a readable error. */
export function exerciseFileFrom(value) {
  if (!isExerciseFile(value) || !Array.isArray(value.entries)) throw new Error('This file is not an exercise history file.');
  if (value.version > 1) throw new Error('This file was made by a newer version of the app.');
  const entries = value.entries.map((entry) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry?.date ?? '') || !['run', 'workout'].includes(entry.kind)) throw new Error('This file is damaged.');
    return {
      id: newId(),
      dayKey: dayKeyFromIso(entry.date),
      kind: entry.kind,
      ...(PLAN_IDS.includes(entry.plan) ? { plan: entry.plan } : {}),
      ...(typeof entry.text === 'string' && entry.text.trim() ? { text: entry.text.trim() } : {}),
    };
  });
  const plans = Array.isArray(value.plans)
    ? value.plans.filter((p) => PLAN_IDS.includes(p?.id) && Array.isArray(p.items)).map((p) => ({ id: p.id, title: p.title || planTitle(p.id), items: p.items.map(String) }))
    : [];
  return { entries, plans };
}

/** Adds the entries the history doesn't have yet (one run and one workout a day at most). */
export function mergeLog(log, incoming) {
  const seen = new Set(log.map((e) => `${e.dayKey}-${e.kind}`));
  const added = incoming.filter((e) => !seen.has(`${e.dayKey}-${e.kind}`));
  return { log: [...log, ...added], added: added.length };
}

/** The plan for the next workout: the other one from the last workout, Day A to start. */
export function nextPlan(log) {
  const last = [...log].filter((e) => e.kind === 'workout' && e.plan).sort((a, b) => b.dayKey - a.dayKey)[0];
  return last?.plan === 'A' ? 'B' : 'A';
}

export const todayEntry = (log, today) => log.find((e) => e.dayKey === today);

export function logRun(log, today) {
  return [...log.filter((e) => e.dayKey !== today), { id: newId(), dayKey: today, kind: 'run' }];
}

export function logWorkout(log, plan, today) {
  const text = plan.items.join('\n');
  return [...log.filter((e) => e.dayKey !== today), { id: newId(), dayKey: today, kind: 'workout', plan: plan.id, ...(text ? { text } : {}) }];
}

export const removeDay = (log, today) => log.filter((e) => e.dayKey !== today);

export const planItems = (text) => text.split('\n').map((s) => s.trim()).filter(Boolean);

/** The history by year, newest first: counts and entries (newest first). */
export function byYear(log) {
  const years = new Map();
  for (const entry of log) {
    const year = Math.floor(entry.dayKey / 10000);
    if (!years.has(year)) years.set(year, []);
    years.get(year).push(entry);
  }
  return [...years.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, entries]) => ({
      year,
      runs: entries.filter((e) => e.kind === 'run').length,
      workouts: entries.filter((e) => e.kind === 'workout').length,
      entries: entries.sort((a, b) => b.dayKey - a.dayKey),
    }));
}

export const entryLabel = (entry) => (entry.kind === 'run' ? 'Run' : entry.plan ? planTitle(entry.plan) : 'Workout');

export const shortDate = (dayKey) => dateFromDayKey(dayKey).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
