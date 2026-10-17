import { appleSeconds, dateFromAppleSeconds } from './dates';
import { newId } from './backup';

// A file of journal entries to add, e.g. old essays prepared for the owner.
// Unlike a backup it never replaces anything: Import adds its entries to the
// journal. An entry already there (same id) keeps its text, which may have been
// edited since, and only gains photo links and translations it doesn't have
// yet, so importing the same or an updated file again is safe.
//
// { "format": "organizer-journal-entries", "version": 1,
//   "entries": [{ "id", "title", "text", "writtenAt": "2017-09-26T21:52:00+02:00", "photos": ["https://…"],
//                 "translations": { "en": { "title", "text" }, "cs": { "title", "text" } } }] }
//
// An entry's own title and text are Ukrainian; translations hold the other
// languages. translatedFrom is a hash of the Ukrainian title and text they were
// made from, so the app can tell when the Ukrainian has changed since. A file
// whose translations were made from an entry's current Ukrainian replaces the
// entry's outdated ones.

export const JOURNAL_FILE_FORMAT = 'organizer-journal-entries';

export const isJournalFile = (value) => value?.format === JOURNAL_FILE_FORMAT;

export const LANGUAGES = [
  { id: 'uk', label: 'UA' },
  { id: 'en', label: 'EN' },
  { id: 'cs', label: 'CZ' },
];
export const TRANSLATED = ['en', 'cs'];

/** A short fingerprint of a title and text (djb2), to notice when they change. */
export function textHash(title, text) {
  let hash = 5381;
  for (const char of `${title}\u0000${text}`) hash = ((hash * 33) ^ char.codePointAt(0)) >>> 0;
  return hash.toString(36);
}

/** The entry's title and text in a language, or null when there is no such translation. */
export function entryIn(entry, lang) {
  if (lang === 'uk') return { title: entry.title ?? '', text: entry.text ?? '' };
  const translation = entry.translations?.[lang];
  return translation?.text ? translation : null;
}

/** True when the Ukrainian has changed since the translations were made. */
export const translationsStale = (entry) =>
  Boolean(entry.translations && entry.translatedFrom && entry.translatedFrom !== textHash(entry.title ?? '', entry.text ?? ''));

function translationsFrom(value) {
  const out = {};
  for (const lang of TRANSLATED) {
    const t = value?.[lang];
    if (typeof t?.text === 'string' && t.text.trim()) out[lang] = { title: typeof t.title === 'string' ? t.title.trim() : '', text: t.text.trim() };
  }
  return Object.keys(out).length ? out : null;
}

/** Entries ready to store. Throws a readable error. */
export function journalEntriesFrom(value, now = appleSeconds()) {
  if (!isJournalFile(value) || !Array.isArray(value.entries)) throw new Error('This file is not a journal file.');
  if (value.version > 1) throw new Error('This file was made by a newer version of the app.');
  return value.entries.map((entry) => {
    const written = Date.parse(entry?.writtenAt);
    if (typeof entry?.text !== 'string' || Number.isNaN(written)) throw new Error('This file is damaged.');
    const photos = Array.isArray(entry.photos) ? entry.photos.filter((url) => typeof url === 'string' && url.startsWith('https://')) : [];
    const title = typeof entry.title === 'string' ? entry.title.trim() : '';
    const text = entry.text.trim();
    const translations = translationsFrom(entry.translations);
    return {
      id: typeof entry.id === 'string' && entry.id ? entry.id : newId(),
      title,
      text,
      ...(translations ? { translations, translatedFrom: typeof entry.translatedFrom === 'string' ? entry.translatedFrom : textHash(title, text) } : {}),
      writtenOn: appleSeconds(new Date(written)),
      hasTime: true,
      ...(photos.length ? { photos } : {}),
      createdAt: now,
      updatedAt: now,
    };
  });
}

/** Adds the new entries; ones already in the journal only gain missing photo links and translations. */
export function addEntries(current, incoming) {
  const byId = new Map(incoming.map((e) => [e.id, e]));
  let updated = 0;
  const entries = current.map((entry) => {
    const from = byId.get(entry.id);
    const photos = (from?.photos ?? []).filter((url) => !(entry.photos ?? []).includes(url));
    const current = textHash(entry.title ?? '', entry.text ?? '');
    const fresh = from?.translatedFrom === current && entry.translatedFrom !== current;
    const missing = TRANSLATED.filter((lang) => from?.translations?.[lang] && (fresh || !entry.translations?.[lang]));
    if (photos.length === 0 && missing.length === 0) return entry;
    updated += 1;
    const next = { ...entry };
    if (photos.length) next.photos = [...(entry.photos ?? []), ...photos];
    if (missing.length) {
      next.translations = { ...(entry.translations ?? {}) };
      for (const lang of missing) next.translations[lang] = from.translations[lang];
      // Made from the file's Ukrainian: if the entry was edited since, it shows as outdated.
      next.translatedFrom = fresh ? current : (entry.translatedFrom ?? from.translatedFrom);
    }
    return next;
  });
  const ids = new Set(current.map((e) => e.id));
  const added = incoming.filter((e) => !ids.has(e.id));
  return { entries: [...entries, ...added], added: added.length, updated };
}

/** A journal file of the entries still missing English or Czech, or whose Ukrainian changed since, to be translated and imported back. */
export function fileToTranslate(entries) {
  const pending = entries.filter((entry) => TRANSLATED.some((lang) => !entry.translations?.[lang]) || translationsStale(entry));
  return {
    format: JOURNAL_FILE_FORMAT,
    version: 1,
    entries: pending.map((entry) => ({
      id: entry.id,
      title: entry.title ?? '',
      text: entry.text ?? '',
      writtenAt: dateFromAppleSeconds(entry.writtenOn).toISOString(),
    })),
  };
}
