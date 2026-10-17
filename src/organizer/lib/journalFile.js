import { appleSeconds } from './dates';
import { newId } from './backup';

// A file of journal entries to add, e.g. old essays prepared for the owner.
// Unlike a backup it never replaces anything: Import adds its entries to the
// journal and skips any already there (same id), so importing twice is safe.
//
// { "format": "organizer-journal-entries", "version": 1,
//   "entries": [{ "id", "title", "text", "writtenAt": "2017-09-26T21:52:00+02:00" }] }

export const JOURNAL_FILE_FORMAT = 'organizer-journal-entries';

export const isJournalFile = (value) => value?.format === JOURNAL_FILE_FORMAT;

/** Entries ready to store. Throws a readable error. */
export function journalEntriesFrom(value, now = appleSeconds()) {
  if (!isJournalFile(value) || !Array.isArray(value.entries)) throw new Error('This file is not a journal file.');
  if (value.version > 1) throw new Error('This file was made by a newer version of the app.');
  return value.entries.map((entry) => {
    const written = Date.parse(entry?.writtenAt);
    if (typeof entry?.text !== 'string' || Number.isNaN(written)) throw new Error('This file is damaged.');
    return {
      id: typeof entry.id === 'string' && entry.id ? entry.id : newId(),
      title: typeof entry.title === 'string' ? entry.title.trim() : '',
      text: entry.text.trim(),
      writtenOn: appleSeconds(new Date(written)),
      hasTime: true,
      createdAt: now,
      updatedAt: now,
    };
  });
}

/** Adds the new entries, skipping ids already in the journal. */
export function addEntries(current, incoming) {
  const ids = new Set(current.map((e) => e.id));
  const added = incoming.filter((e) => !ids.has(e.id));
  return { entries: [...current, ...added], added: added.length };
}
