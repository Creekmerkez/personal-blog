// Everything is stored on this device only, in the browser's IndexedDB.
// Nothing is ever sent to a server.
const DB_NAME = 'organizer';
const STORE = 'kv';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run(mode, action) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        tx.onerror = () => reject(tx.error);
      }),
  );
}

export const indexedDbStorage = {
  get: (key) => run('readonly', (store) => store.get(key)),
  set: (key, value) => run('readwrite', (store) => store.put(value, key)),
};

/** For tests and as a last resort when IndexedDB is unavailable. */
export function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    get: async (key) => values.get(key),
    set: async (key, value) => {
      values.set(key, value);
    },
  };
}

/** Asks the browser to keep this data even when storage runs low. */
export function requestPersistence() {
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
}
