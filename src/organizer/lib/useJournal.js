import { useCallback, useEffect, useRef, useState } from 'react';
import {
  decryptEntries, encryptEntries, newJournalKey, unwrapWithPassword, unwrapWithPrf, wrapWithPassword, wrapWithPrf,
} from './journalCrypto';
import { createPasskey, passkeySecret } from './passkey';

/**
 * The journal's lock state. status: 'loading' | 'setup' | 'locked' | 'unlocked'.
 * The decrypted entries and the key exist only in memory while unlocked, and
 * are dropped as soon as the app leaves the screen.
 */
export function useJournal(storage) {
  const [status, setStatus] = useState('loading');
  const [lock, setLock] = useState(null);
  const [entries, setEntries] = useState([]);
  const keyRef = useRef(null);
  const busyRef = useRef(false); // Face ID prompts must not lock the journal mid-way

  useEffect(() => {
    storage.get('journalLock').then((saved) => {
      setLock(saved ?? null);
      setStatus(saved ? 'locked' : 'setup');
    });
  }, [storage]);

  const lockNow = useCallback(() => {
    keyRef.current = null;
    setEntries([]);
    setStatus((current) => (current === 'unlocked' ? 'locked' : current));
  }, []);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && !busyRef.current) lockNow();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [lockNow]);

  const openWith = useCallback(
    async (key) => {
      setEntries(await decryptEntries(key, await storage.get('journalEntries')));
      keyRef.current = key;
      setStatus('unlocked');
    },
    [storage],
  );

  const withPrompt = async (action) => {
    busyRef.current = true;
    try {
      return await action();
    } finally {
      busyRef.current = false;
    }
  };

  const setup = useCallback(
    async (password) => {
      const key = newJournalKey();
      const next = { version: 1, password: await wrapWithPassword(key, password) };
      await storage.set('journalEntries', await encryptEntries(key, []));
      await storage.set('journalLock', next);
      setLock(next);
      keyRef.current = key;
      setEntries([]);
      setStatus('unlocked');
    },
    [storage],
  );

  const unlockWithPassword = useCallback(async (password) => openWith(await unwrapWithPassword(lock.password, password)), [lock, openWith]);

  const unlockWithFaceId = useCallback(
    () => withPrompt(async () => openWith(await unwrapWithPrf(lock.passkey.wrapped, await passkeySecret(lock.passkey)))),
    [lock, openWith],
  );

  /** Adds Face ID to an unlocked journal. */
  const enableFaceId = useCallback(
    () =>
      withPrompt(async () => {
        const created = await createPasskey();
        const secret = created.prfOutput ?? (await passkeySecret(created));
        const next = { ...lock, passkey: { credentialId: created.credentialId, prfSalt: created.prfSalt, wrapped: await wrapWithPrf(keyRef.current, secret) } };
        await storage.set('journalLock', next);
        setLock(next);
      }),
    [lock, storage],
  );

  const saveEntries = useCallback(
    async (next) => {
      if (!keyRef.current) throw new Error('The journal is locked.');
      await storage.set('journalEntries', await encryptEntries(keyRef.current, next));
      setEntries(next);
    },
    [storage],
  );

  /** For export: unlocks with Face ID if needed. Returns the entries, or [] when there is no journal yet. */
  const entriesForExport = useCallback(async () => {
    if (status === 'setup') return [];
    if (status !== 'unlocked') {
      if (!lock?.passkey) throw new Error('Unlock the Journal first, so it is included in the backup.');
      await unlockWithFaceId();
      return decryptEntries(keyRef.current, await storage.get('journalEntries'));
    }
    return entries;
  }, [status, lock, entries, unlockWithFaceId, storage]);

  return { status, hasFaceId: Boolean(lock?.passkey), entries, setup, unlockWithPassword, unlockWithFaceId, enableFaceId, lockNow, saveEntries, entriesForExport };
}
