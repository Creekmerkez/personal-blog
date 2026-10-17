// Password protection for export files, in the same format as the iPhone
// app: AES-GCM with a 256-bit key from PBKDF2-SHA256 (600,000 rounds, random
// salt). "sealed" is nonce + ciphertext + tag, like CryptoKit's combined box.
// Uses only the browser's built-in Web Crypto.

export const FORMAT_NAME = 'organizer-encrypted-backup';
export const DEFAULT_ITERATIONS = 600_000;
export const MIN_PASSWORD_LENGTH = 8;

const encoder = new TextEncoder();

// Chunked: spreading a whole large file into one call overflows the stack.
function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function deriveKey(password, salt, iterations) {
  const base = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export function isEncrypted(text) {
  try {
    return JSON.parse(text)?.format === FORMAT_NAME;
  } catch {
    return false;
  }
}

export async function seal(plainText, password, iterations = DEFAULT_ITERATIONS) {
  if ([...password].length < MIN_PASSWORD_LENGTH) throw new Error('The password needs at least 8 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, iterations);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, encoder.encode(plainText)));
  const sealed = new Uint8Array(nonce.length + cipher.length);
  sealed.set(nonce);
  sealed.set(cipher, nonce.length);
  return JSON.stringify(
    { format: FORMAT_NAME, iterations, kdf: 'pbkdf2-sha256', salt: toBase64(salt), sealed: toBase64(sealed), version: 1 },
    null,
    2,
  );
}

export async function open(text, password) {
  let envelope;
  try {
    envelope = JSON.parse(text);
  } catch {
    throw new Error('This file could not be read.');
  }
  const valid =
    envelope?.format === FORMAT_NAME &&
    envelope.version <= 1 &&
    envelope.kdf === 'pbkdf2-sha256' &&
    Number.isInteger(envelope.iterations) &&
    envelope.iterations >= 1000 &&
    envelope.iterations <= 10_000_000;
  if (!valid) throw new Error('This file could not be read.');
  let sealed;
  let salt;
  try {
    sealed = fromBase64(envelope.sealed);
    salt = fromBase64(envelope.salt);
  } catch {
    throw new Error('This file could not be read.');
  }
  if (sealed.length < 12 + 16) throw new Error('This file could not be read.');
  const key = await deriveKey(password, salt, envelope.iterations);
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: sealed.slice(0, 12) }, key, sealed.slice(12));
    return new TextDecoder().decode(plain);
  } catch {
    // A wrong password and a changed file look the same, by design.
    throw new Error('Wrong password.');
  }
}
