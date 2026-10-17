import { fromBase64, randomBytes, toBase64 } from './journalCrypto';

// Face ID for the journal through a passkey on this iPhone (WebAuthn) and its
// PRF extension, which returns a secret only after Face ID. Nothing is sent to
// any server: there is none. Works in Safari on iOS 18 and later.

export const passkeysSupported = () => typeof window !== 'undefined' && Boolean(window.PublicKeyCredential && navigator.credentials?.create);

function prfFrom(credential) {
  const first = credential?.getClientExtensionResults?.()?.prf?.results?.first;
  return first ? new Uint8Array(first) : null;
}

/** Creates the passkey. Returns { credentialId, prfSalt } or throws when Face ID or PRF is unavailable. */
export async function createPasskey() {
  const prfSalt = randomBytes(32);
  const credential = await navigator.credentials.create({
    publicKey: {
      rp: { name: 'Organizer', id: window.location.hostname },
      user: { id: randomBytes(16), name: 'Organizer Journal', displayName: 'Organizer Journal' },
      challenge: randomBytes(32),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
      extensions: { prf: { eval: { first: prfSalt } } },
      timeout: 60000,
    },
  });
  const results = credential.getClientExtensionResults?.()?.prf;
  if (!results?.enabled && !results?.results) throw new Error('Face ID for the journal needs iOS 18 or later.');
  return { credentialId: toBase64(new Uint8Array(credential.rawId)), prfSalt: toBase64(prfSalt), prfOutput: prfFrom(credential) };
}

/** Asks for Face ID and returns the passkey's PRF secret. */
export async function passkeySecret({ credentialId, prfSalt }) {
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      rpId: window.location.hostname,
      allowCredentials: [{ type: 'public-key', id: fromBase64(credentialId) }],
      userVerification: 'required',
      extensions: { prf: { eval: { first: fromBase64(prfSalt) } } },
      timeout: 60000,
    },
  });
  const secret = prfFrom(credential);
  if (!secret) throw new Error('Face ID could not open the journal.');
  return secret;
}
