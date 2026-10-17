import { useCallback, useEffect, useState } from 'react';
import { OrganizerContext } from './context';
import { emptyData, validateBackup } from './backup';
import { DEFAULT_ROTATION_SIZE } from './words';

const DEFAULT_SETTINGS = { rotationSize: DEFAULT_ROTATION_SIZE, lastExportAt: null };

/** Loads the organizer from `storage` and saves every change straight back. */
export function OrganizerProvider({ storage, today, children }) {
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    let alive = true;
    Promise.all([storage.get('data'), storage.get('settings')])
      .then(([savedData, savedSettings]) => {
        if (!alive) return;
        let loaded = emptyData();
        try {
          if (savedData) loaded = validateBackup(savedData);
        } catch {
          // Keep an unreadable copy rather than overwriting it silently.
          storage.set(`data-unreadable-${Date.now()}`, savedData);
        }
        setData(loaded);
        setSettings({ ...DEFAULT_SETTINGS, ...(savedSettings ?? {}) });
      })
      .catch(() => alive && setData(emptyData()));
    return () => {
      alive = false;
    };
  }, [storage]);

  useEffect(() => {
    if (data) storage.set('data', data);
  }, [data, storage]);

  const update = useCallback((change) => setData((current) => change(current)), []);

  const updateSettings = useCallback(
    (change) =>
      setSettings((current) => {
        const next = { ...current, ...change };
        storage.set('settings', next);
        return next;
      }),
    [storage],
  );

  if (!data) return null;
  return (
    <OrganizerContext.Provider value={{ data, update, settings, updateSettings, today, storage }}>
      {children}
    </OrganizerContext.Provider>
  );
}
