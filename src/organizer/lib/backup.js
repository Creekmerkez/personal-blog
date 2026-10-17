import { appleSeconds } from './dates';

// The whole organizer is one object in the same shape as the iPhone app's
// backup file, so export and import work in both directions unchanged.
export const FORMAT_VERSION = 1;

export const LISTS = ['myTasks', 'sonTasks', 'vaccinations', 'doctorVisits', 'games', 'places', 'words', 'journal'];

export function emptyData() {
  return {
    formatVersion: FORMAT_VERSION,
    exportedAt: appleSeconds(),
    myTasks: [],
    sonTasks: [],
    vaccinations: [],
    doctorVisits: [],
    games: [],
    places: [],
    words: [],
    journal: [],
  };
}

export const newId = () => crypto.randomUUID().toUpperCase();

/** Checks a parsed file before anything is replaced. Throws a readable error. */
export function validateBackup(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('This file is not an Organizer backup.');
  }
  if (typeof value.formatVersion !== 'number') {
    throw new Error('This file is not an Organizer backup.');
  }
  if (value.formatVersion > FORMAT_VERSION) {
    throw new Error('This file was made by a newer version of the app.');
  }
  const data = emptyData();
  for (const list of LISTS) {
    const items = value[list] ?? [];
    if (!Array.isArray(items)) throw new Error('This file is damaged.');
    data[list] = items;
  }
  for (const task of data.myTasks) {
    if (typeof task.name !== 'string' || typeof task.weekdayMask !== 'number') {
      throw new Error('This file is damaged.');
    }
  }
  for (const word of data.words) {
    if (typeof word.word !== 'string' || typeof word.nextReviewDayKey !== 'number') {
      throw new Error('This file is damaged.');
    }
  }
  data.exportedAt = typeof value.exportedAt === 'number' ? value.exportedAt : appleSeconds();
  return data;
}

/** JSON for export: the iPhone app reads missing keys, not nulls, as "no value". */
export function serialize(data) {
  return JSON.stringify({ ...data, exportedAt: appleSeconds() }, (key, val) => (val === null ? undefined : val), 2);
}

export function summarize(data) {
  const son = data.sonTasks.length + data.vaccinations.length + data.doctorVisits.length + data.games.length + data.places.length;
  return `${data.myTasks.length} tasks, ${son} Son entries, ${data.words.length} words and ${data.journal.length} journal entries`;
}
