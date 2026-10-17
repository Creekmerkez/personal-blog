import { describe, it, expect } from 'vitest';
import { addEntries, isJournalFile, journalEntriesFrom } from './journalFile';
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
    expect(twice.added).toBe(0);
    expect(twice.entries).toHaveLength(3);
  });
});
