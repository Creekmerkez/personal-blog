import { describe, it, expect } from 'vitest';
import { addEntries, entryIn, isJournalFile, journalEntriesFrom, translationsStale } from './journalFile';
import { dateFromAppleSeconds } from './dates';

const file = (entries, extra = {}) => ({ format: 'organizer-journal-entries', version: 1, entries, ...extra });

describe('journal entries file', () => {
  it('reads entries with their exact date and time (positive)', () => {
    const [entry] = journalEntriesFrom(file([{ id: 'A', title: ' Поворот ', text: 'Завтра може статися що завгодно.\n', writtenAt: '2017-10-31T22:21:00+01:00' }]), 0);
    expect(entry).toMatchObject({ id: 'A', title: 'Поворот', text: 'Завтра може статися що завгодно.', hasTime: true });
    expect(dateFromAppleSeconds(entry.writtenOn).toISOString()).toBe('2017-10-31T21:21:00.000Z');
  });

  it('refuses a backup, a damaged entry or a newer version (negative)', () => {
    expect(isJournalFile({ formatVersion: 1, myTasks: [] })).toBe(false);
    expect(() => journalEntriesFrom({ formatVersion: 1 })).toThrow('not a journal file');
    expect(() => journalEntriesFrom(file([{ text: 'x', writtenAt: 'yesterday' }]))).toThrow('damaged');
    expect(() => journalEntriesFrom(file([{ writtenAt: '2017-10-31T22:21:00+01:00' }]))).toThrow('damaged');
    expect(() => journalEntriesFrom(file([], { version: 2 }))).toThrow('newer version');
  });

  it('adds only entries that are not there yet, so importing twice is safe', () => {
    const once = addEntries([{ id: 'old' }], [{ id: 'A' }, { id: 'B' }]);
    expect(once.added).toBe(2);
    const twice = addEntries(once.entries, [{ id: 'A' }, { id: 'B' }]);
    expect(twice).toMatchObject({ added: 0, updated: 0 });
    expect(twice.entries).toHaveLength(3);
  });

  it('an entry already there keeps its edited text and only gains new photo links', () => {
    const edited = { id: 'A', text: 'My edit', photos: ['https://x/1.jpg'] };
    const { entries, added, updated } = addEntries([edited], [{ id: 'A', text: 'Original', photos: ['https://x/1.jpg', 'https://x/2.jpg'] }]);
    expect({ added, updated }).toEqual({ added: 0, updated: 1 });
    expect(entries[0]).toEqual({ id: 'A', text: 'My edit', photos: ['https://x/1.jpg', 'https://x/2.jpg'] });
  });

  it('keeps only https photo links (negative)', () => {
    const [entry] = journalEntriesFrom(file([{ text: 'x', writtenAt: '2017-10-31T22:21:00+01:00', photos: ['https://ok/1.jpg', 'http://plain/2.jpg', 'javascript:alert(1)', 7] }]));
    expect(entry.photos).toEqual(['https://ok/1.jpg']);
  });
});

describe('translations in journal files', () => {
  const base = { id: 'A', title: 'Поворот', text: 'Завтра може статися що завгодно.', writtenAt: '2017-10-31T22:21:00+01:00' };
  const en = { title: 'A Turn', text: 'Anything can happen tomorrow.' };
  const cs = { title: 'Zatáčka', text: 'Zítra se může stát cokoli.' };

  it('reads translations and marks what they were made from (positive)', () => {
    const [entry] = journalEntriesFrom(file([{ ...base, translations: { en, cs, de: { text: 'x' } } }]));
    expect(entryIn(entry, 'en')).toEqual(en);
    expect(entryIn(entry, 'cs')).toEqual(cs);
    expect(entryIn(entry, 'uk')).toEqual({ title: 'Поворот', text: 'Завтра може статися що завгодно.' });
    expect(entry.translations.de).toBeUndefined();
    expect(translationsStale(entry)).toBe(false);
    expect(translationsStale({ ...entry, text: 'Інший текст' })).toBe(true);
  });

  it('adds translations to an entry already there, keeping its edited text', () => {
    const [plain] = journalEntriesFrom(file([base]));
    const edited = { ...plain, text: 'Мій виправлений текст' };
    const [withTranslations] = journalEntriesFrom(file([{ ...base, translations: { en, cs } }]));
    const { entries, updated } = addEntries([edited], [withTranslations]);
    expect(updated).toBe(1);
    expect(entries[0].text).toBe('Мій виправлений текст');
    expect(entryIn(entries[0], 'en')).toEqual(en);
    expect(translationsStale(entries[0])).toBe(true); // made from the older Ukrainian
  });

  it('never overwrites a translation the entry already has (negative)', () => {
    const mine = { id: 'A', title: 't', text: 'x', translations: { en: { title: 'Mine', text: 'My own' } } };
    const { entries, updated } = addEntries([mine], [{ id: 'A', translations: { en, cs } }]);
    expect(updated).toBe(1);
    expect(entries[0].translations.en.text).toBe('My own');
    expect(entries[0].translations.cs).toEqual(cs);
    expect(entryIn({ id: 'B', text: 'x' }, 'en')).toBeNull();
  });
});
