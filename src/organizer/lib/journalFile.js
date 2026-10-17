import { appleSeconds } from './dates';
import { newId } from './backup';

// A file of journal entries to add, e.g. old essays prepared for the owner.
// Unlike a backup it never replaces anything: Import adds its entries to the
// journal. An entry already there (same id) keeps its text, which may have been
// edited since, and only gains photo links it doesn't have yet, so importing
// the same or an updated file again is safe.
//
// { "format": "organizer-journal-entries", "version": 1,
//   "entries": [{ "id", "title", "text", "writtenAt": "2017-09-26T21:52:00+02:00", "photos": ["https://…"] }] }

export const JOURNAL_FILE_FORMAT = 'organizer-journal-entries';

export const isJournalFile = (value) => value?.format === JOURNAL_FILE_FORMAT;

/** Entries ready to store. Throws a readable error. */
export function journalEntriesFrom(value, now = appleSeconds()) {
  if (!isJournalFile(value) || !Array.isArray(value.entries)) throw new Error('This file is not a journal file.');
  if (value.version > 1) throw new Error('This file was made by a newer version of the app.');
  return value.entries.map((entry) => {
    const written = Date.parse(entry?.writtenAt);
    if (typeof entry?.text !== 'string' || Number.isNaN(written)) throw new Error('This file is damaged.');
    const photos = Array.isArray(entry.photos) ? entry.photos.filter((url) => typeof url === 'string' && url.startsWith('https://')) : [];
    return {
      id: typeof entry.id === 'string' && entry.id ? entry.id : newId(),
      title: typeof entry.title === 'string' ? entry.title.trim() : '',
      text: entry.text.trim(),
      writtenOn: appleSeconds(new Date(written)),
      hasTime: true,
      ...(photos.length ? { photos } : {}),
      createdAt: now,
      updatedAt: now,
    };
  });
}

/** Adds the new entries; ones already in the journal only gain missing photo links. */
export function addEntries(current, incoming) {
  const byId = new Map(incoming.map((e) => [e.id, e]));
  let updated = 0;
  const entries = current.map((entry) => {
    const photos = (byId.get(entry.id)?.photos ?? []).filter((url) => !(entry.photos ?? []).includes(url));
    if (photos.length === 0) return entry;
    updated += 1;
    return { ...entry, photos: [...(entry.photos ?? []), ...photos] };
  });
  const ids = new Set(current.map((e) => e.id));
  const added = incoming.filter((e) => !ids.has(e.id));
  return { entries: [...entries, ...added], added: added.length, updated };
}
