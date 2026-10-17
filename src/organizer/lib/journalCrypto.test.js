import { describe, it, expect } from 'vitest';
import { decryptEntries, encryptEntries, newJournalKey, unwrapWithPassword, unwrapWithPrf, wrapWithPassword, wrapWithPrf } from './journalCrypto';

const fast = 1000; // fewer rounds than the app's 600,000, same code path
const entries = [{ id: '1', title: 'Morning', text: 'A very private thought', writtenOn: 1, createdAt: 1, updatedAt: 1 }];

describe('journal encryption', () => {
  it('stores entries only as ciphertext and reads them back with the key (positive)', async () => {
    const key = newJournalKey();
    const stored = await encryptEntries(key, entries);
    expect(stored).not.toContain('private');
    expect(await decryptEntries(key, stored)).toEqual(entries);
    expect(await decryptEntries(key, undefined)).toEqual([]);
  });

  it('the recovery password unlocks the journal key; a wrong one does not (negative)', async () => {
    const key = newJournalKey();
    const lock = await wrapWithPassword(key, 'correct horse', fast);
    expect(lock.wrapped).not.toContain('correct');
    expect(await unwrapWithPassword(lock, 'correct horse')).toEqual(key);
    await expect(unwrapWithPassword(lock, 'correct hors')).rejects.toThrow('Wrong password');
  });

  it('the Face ID secret unlocks the journal key; another secret does not', async () => {
    const key = newJournalKey();
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const wrapped = await wrapWithPrf(key, secret);
    expect(await unwrapWithPrf(wrapped, secret)).toEqual(key);
    await expect(unwrapWithPrf(wrapped, crypto.getRandomValues(new Uint8Array(32)))).rejects.toThrow('Face ID could not open');
  });

  it('a different journal key cannot read the entries', async () => {
    const stored = await encryptEntries(newJournalKey(), entries);
    await expect(decryptEntries(newJournalKey(), stored)).rejects.toThrow();
  });
});
