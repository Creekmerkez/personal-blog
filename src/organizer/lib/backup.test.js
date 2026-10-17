import { describe, it, expect } from 'vitest';
import { emptyData, serialize, summarize, validateBackup } from './backup';
import { isEncrypted, open, seal } from './crypto';
import fixture from './__fixtures__/encrypted-backup.json?raw';

// Sealed with Node's own crypto module (not Web Crypto), the way the iPhone app seals files.

describe('backup files', () => {
  it('reads a plain backup and fills in missing lists (positive)', () => {
    const data = validateBackup({ formatVersion: 1, exportedAt: 1, myTasks: [{ name: 'Yoga', weekdayMask: 127 }], words: [] });
    expect(data.myTasks).toHaveLength(1);
    expect(data.journal).toEqual([]);
    expect(summarize(data)).toBe('1 tasks, 0 Son entries, 0 words and 0 journal entries');
  });

  it('rejects files that are not backups, are damaged, or come from a newer version (negative)', () => {
    expect(() => validateBackup({ hello: 'world' })).toThrow('not an Organizer backup');
    expect(() => validateBackup({ formatVersion: 1, myTasks: 'nope' })).toThrow('damaged');
    expect(() => validateBackup({ formatVersion: 1, myTasks: [{ name: 5 }] })).toThrow('damaged');
    expect(() => validateBackup({ formatVersion: 2 })).toThrow('newer version');
  });

  it('writes no nulls, so the iPhone app can read it too', () => {
    const data = { ...emptyData(), myTasks: [{ name: 'Yoga', weekdayMask: 127, lastCompletedDayKey: null }] };
    expect(serialize(data)).not.toContain('null');
    expect(validateBackup(JSON.parse(serialize(data))).myTasks[0].name).toBe('Yoga');
  });
});

describe('password-protected files', () => {
  it('opens with the right password and hides the content (positive)', async () => {
    const sealed = await seal('{"secret":"a private thought"}', 'correct horse', 1000);
    expect(isEncrypted(sealed)).toBe(true);
    expect(sealed).not.toContain('private thought');
    expect(await open(sealed, 'correct horse')).toBe('{"secret":"a private thought"}');
  });

  it('rejects a wrong password, a changed file and short passwords (negative)', async () => {
    const sealed = await seal('{"a":1}', 'correct horse', 1000);
    await expect(open(sealed, 'correct hors')).rejects.toThrow('Wrong password');
    const envelope = JSON.parse(sealed);
    const bytes = Uint8Array.from(atob(envelope.sealed), (c) => c.charCodeAt(0));
    bytes[bytes.length - 1] ^= 1;
    const tampered = JSON.stringify({ ...envelope, sealed: btoa(String.fromCharCode(...bytes)) });
    await expect(open(tampered, 'correct horse')).rejects.toThrow('Wrong password');
    await expect(seal('x', '1234567')).rejects.toThrow('at least 8');
    await expect(open('junk', 'correct horse')).rejects.toThrow('could not be read');
    expect(isEncrypted('{"formatVersion":1}')).toBe(false);
  });

  it('opens a file sealed by a separate implementation of the iPhone app format', async () => {
    const plain = JSON.parse(await open(fixture, 'correct horse'));
    expect(plain.myTasks[0].name).toBe('Yoga');
  });

  it('handles a large backup, like hundreds of words', async () => {
    const big = JSON.stringify({ words: Array.from({ length: 3000 }, (_, i) => ({ word: `slovo ${i}`, translation: 'переклад'.repeat(5) })) });
    expect(new TextEncoder().encode(big).length).toBeGreaterThan(300000);
    const sealed = await seal(big, 'correct horse', 1000);
    expect(await open(sealed, 'correct horse')).toBe(big);
  });

  it('uses the app setting of 600,000 rounds by default', async () => {
    const sealed = JSON.parse(await seal('{}', 'correct horse'));
    expect(sealed.iterations).toBe(600000);
  }, 20000);
});
