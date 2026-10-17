import { useCallback, useEffect, useRef, useState } from 'react';
import {
  decryptEntries, encryptEntries, fromBase64, newJournalKey, toBase64, unwrapWithPassword, unwrapWithPrf, wrapWithPassword, wrapWithPrf,
} from './journalCrypto';
import { createPasskey, passkeySecret } from './passkey';
import { addEntries as merge } from './journalFile';

/**
 * The journal's lock state. status: 'loading' | 'setup' | 'locked' | 'unlocked'.
 * The decrypted entries and the key exist only in memory while unlocked, and
 * are dropped as soon as the app leaves the screen.
 *
 * The owner can turn the lock off. The journal key is then stored as is
 * (lock.openKey), so the journal opens by itself like the rest of the app and
 * never locks; its entries stay as safe as the iPhone's own lock.
 */
export function useJournal(storage) {
  const [status, setStatus] = useState('loading');
  const [lock, setLock] = useState(null);
  const [entries, setEntries] = useState([]);
  const keyRef = useRef(null);
  const busyRef = useRef(false); // Face ID prompts must not lock the journal mid-way
  const pickerUntilRef = useRef(0); // nor must picking photos, in case the picker hides the page

  const isOpen = Boolean(lock?.openKey);
  const openRef = useRef(false);
  openRef.current = isOpen;

  const lockNow = useCallback(() => {
    if (openRef.current) return;
    keyRef.current = null;
    setEntries([]);
    setStatus((current) => (current === 'unlocked' ? 'locked' : current));
  }, []);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && !busyRef.current && Date.now() > pickerUntilRef.current) lockNow();
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

  useEffect(() => {
    storage.get('journalLock').then(async (saved) => {
      setLock(saved ?? null);
      if (saved?.openKey) await openWith(fromBase64(saved.openKey));
      else setStatus(saved ? 'locked' : 'setup');
    });
  }, [storage, openWith]);

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

  /** A new journal without a lock. */
  const setupOpen = useCallback(async () => {
    const key = newJournalKey();
    const next = { version: 1, openKey: toBase64(key) };
    await storage.set('journalEntries', await encryptEntries(key, []));
    await storage.set('journalLock', next);
    setLock(next);
    keyRef.current = key;
    setEntries([]);
    setStatus('unlocked');
  }, [storage]);

  /** Turns the lock off: no password or Face ID from now on. The journal must be unlocked. */
  const removeLock = useCallback(async () => {
    if (!keyRef.current) throw new Error('Unlock the Journal first.');
    const next = { version: 1, openKey: toBase64(keyRef.current) };
    await storage.set('journalLock', next);
    setLock(next);
  }, [storage]);

  /** Turns the lock back on with a new password (Face ID can be added again in the Journal). */
  const addPassword = useCallback(
    async (password) => {
      if (!keyRef.current) throw new Error('Unlock the Journal first.');
      const next = { version: 1, password: await wrapWithPassword(keyRef.current, password) };
      await storage.set('journalLock', next);
      setLock(next);
    },
    [storage],
  );

  /** Deletes the journal and its entries, for an owner who can no longer unlock it. */
  const reset = useCallback(async () => {
    await storage.set('journalEntries', null);
    await storage.set('journalLock', null);
    keyRef.current = null;
    setLock(null);
    setEntries([]);
    setStatus('setup');
  }, [storage]);

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

  /** Keeps the journal open while the photo picker is up (at most 5 minutes, if it is never closed). */
  const holdForPicker = useCallback((open) => {
    pickerUntilRef.current = open ? Date.now() + 5 * 60 * 1000 : 0;
  }, []);

  /** Adds entries from a journal file to the unlocked journal. Returns { added, updated }. */
  const addEntries = useCallback(
    async (incoming) => {
      if (!keyRef.current) throw new Error('The journal is locked.');
      // Read what is stored, not this render's state: the journal may have been unlocked a moment ago.
      const { entries: next, added, updated } = merge(await decryptEntries(keyRef.current, await storage.get('journalEntries')), incoming);
      await storage.set('journalEntries', await encryptEntries(keyRef.current, next));
      setEntries(next);
      return { added, updated };
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

  return { status, isOpen, hasFaceId: Boolean(lock?.passkey), entries, setup, setupOpen, removeLock, addPassword, reset, unlockWithPassword, unlockWithFaceId, enableFaceId, lockNow, saveEntries, addEntries, holdForPicker, entriesForExport };
}
