import { useState } from 'react';
import { MIN_PASSWORD_LENGTH } from '../lib/crypto';
import { Section, Sheet } from '../components/ui';

/**
 * Asks for a new export password (twice) or for the password of a file being imported.
 * `title`, `action` and `footer` change the wording when it asks for another new password.
 */
export default function PasswordSheet({ mode, onSubmit, onClose, title, action, footer }) {
  const [password, setPassword] = useState('');
  const [repeated, setRepeated] = useState('');
  const [error, setError] = useState(null);
  const [working, setWorking] = useState(false);

  const creating = mode === 'create';
  const canSubmit = creating ? [...password].length >= MIN_PASSWORD_LENGTH && password === repeated : password !== '';

  const submit = async (event) => {
    event?.preventDefault();
    if (!canSubmit || working) return;
    setWorking(true);
    setError(null);
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err.message);
      setWorking(false);
    }
  };

  return (
    <Sheet
      title={title ?? (creating ? 'Protect the File' : 'File Password')}
      onClose={working ? undefined : onClose}
      leading={<button type="button" className="org-link" disabled={working} onClick={onClose}>Cancel</button>}
      trailing={<button type="button" className="org-link org-strong" disabled={!canSubmit || working} onClick={submit}>{action ?? (creating ? 'Export' : 'Open')}</button>}
    >
      <form onSubmit={submit}>
        <Section
          footer={
            footer ?? (creating
              ? 'At least 8 characters. The file can only be opened with this password. If you forget it, the file cannot be opened, so keep it somewhere safe, for example in Passwords on your iPhone.'
              : 'Enter the password chosen when this file was exported.')
          }
        >
          <input className="org-input" type="password" autoComplete={creating ? 'new-password' : 'current-password'} placeholder="Password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          {creating && (
            <input className="org-input" type="password" autoComplete="new-password" placeholder="Repeat Password" aria-label="Repeat Password" value={repeated} onChange={(e) => setRepeated(e.target.value)} />
          )}
        </Section>
        {error && <p className="org-error" role="alert">{error}</p>}
        {working && <p className="org-section-footer">{creating ? 'Encrypting…' : 'Opening…'}</p>}
        <button type="submit" hidden aria-hidden="true" />
      </form>
    </Sheet>
  );
}
