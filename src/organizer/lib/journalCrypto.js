// Journal encryption. Entries are stored only as ciphertext, under a random
// 256-bit journal key. That key is itself stored twice, each copy encrypted:
// - with a key from the recovery password (PBKDF2-SHA256, 600,000 rounds),
// - with a key from Face ID: a passkey's PRF secret (HKDF-SHA256), which the
//   iPhone releases only after Face ID.
// Without the password or Face ID the entries cannot be decrypted.

const encoder = new TextEncoder();
const decoder = new TextDecoder();
export const PASSWORD_ITERATIONS = 600_000;

export function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
export const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
export const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n));

async function seal(key, bytes) {
  const iv = randomBytes(12);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
  const out = new Uint8Array(12 + cipher.length);
  out.set(iv);
  out.set(cipher, 12);
  return toBase64(out);
}

async function open(key, text) {
  const bytes = fromBase64(text);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12)));
}

const aesKey = (raw, usages = ['encrypt', 'decrypt']) => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, usages);

async function passwordKey(password, salt, iterations) {
  const base = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function prfKey(prfOutput) {
  const base = await crypto.subtle.importKey('raw', prfOutput, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: encoder.encode('organizer-journal-key') },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** A new random journal key, as raw bytes (kept only in memory while unlocked). */
export const newJournalKey = () => randomBytes(32);

export async function wrapWithPassword(journalKey, password, iterations = PASSWORD_ITERATIONS) {
  const salt = randomBytes(16);
  return { salt: toBase64(salt), iterations, wrapped: await seal(await passwordKey(password, salt, iterations), journalKey) };
}

export async function unwrapWithPassword(lock, password) {
  try {
    return await open(await passwordKey(password, fromBase64(lock.salt), lock.iterations), lock.wrapped);
  } catch {
    throw new Error('Wrong password.');
  }
}

export async function wrapWithPrf(journalKey, prfOutput) {
  return seal(await prfKey(prfOutput), journalKey);
}

export async function unwrapWithPrf(wrapped, prfOutput) {
  try {
    return await open(await prfKey(prfOutput), wrapped);
  } catch {
    throw new Error('Face ID could not open the journal.');
  }
}

export async function encryptEntries(journalKey, entries) {
  return seal(await aesKey(journalKey), encoder.encode(JSON.stringify(entries)));
}

export async function decryptEntries(journalKey, text) {
  if (!text) return [];
  return JSON.parse(decoder.decode(await open(await aesKey(journalKey), text)));
}
