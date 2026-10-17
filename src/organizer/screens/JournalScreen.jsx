import { useMemo, useState } from 'react';
import { IoLockClosed, IoLockClosedOutline, IoAdd, IoJournalOutline, IoScanOutline, IoKeyOutline } from 'react-icons/io5';
import { appleSeconds, dateFromAppleSeconds, dateFromDayKey, dayKeyFromDate } from '../lib/dates';
import { newId } from '../lib/backup';
import { MIN_PASSWORD_LENGTH } from '../lib/crypto';
import { passkeysSupported } from '../lib/passkey';
import { Empty, Screen, Section, Sheet } from '../components/ui';

const dayInput = (seconds) => {
  const key = dayKeyFromDate(dateFromAppleSeconds(seconds));
  return `${Math.floor(key / 10000)}-${String(Math.floor(key / 100) % 100).padStart(2, '0')}-${String(key % 100).padStart(2, '0')}`;
};
const fromDayInput = (text) => appleSeconds(dateFromDayKey(Number(text.replaceAll('-', ''))));
const longDate = (seconds) => dateFromAppleSeconds(seconds).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = (seconds) => dateFromAppleSeconds(seconds).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

function heading(entry) {
  if (entry.title?.trim()) return entry.title.trim();
  const line = (entry.text ?? '').split('\n').map((l) => l.trim()).find(Boolean);
  return line || 'Untitled';
}

function useAsync() {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err?.name === 'NotAllowedError' ? 'Face ID was cancelled.' : err.message);
    } finally {
      setBusy(false);
    }
  };
  return { error, busy, run };
}

function Setup({ journal }) {
  const [password, setPassword] = useState('');
  const [repeated, setRepeated] = useState('');
  const { error, busy, run } = useAsync();
  const ok = [...password].length >= MIN_PASSWORD_LENGTH && password === repeated;
  return (
    <Screen title="Journal">
      <Empty icon={<IoJournalOutline />} title="Your Private Journal" text="Thoughts, essays and notes, readable only by you. Entries are encrypted on this iPhone." />
      <Section
        header="Recovery password"
        footer="Used when Face ID is not available. At least 8 characters. If you lose both Face ID and this password, the journal cannot be opened, so keep it in Passwords on your iPhone."
      >
        <input className="org-input" type="password" autoComplete="new-password" placeholder="Password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="org-input" type="password" autoComplete="new-password" placeholder="Repeat Password" aria-label="Repeat Password" value={repeated} onChange={(e) => setRepeated(e.target.value)} />
      </Section>
      {error && <p className="org-error" role="alert">{error}</p>}
      <button type="button" className="org-button org-wide" disabled={!ok || busy} onClick={() => run(() => journal.setup(password))}>
        {busy ? 'Creating…' : 'Create Journal'}
      </button>
    </Screen>
  );
}

/** Also locks the whole organizer when the app lock is on (Settings), with the same password and Face ID. */
export function Locked({ journal, title = 'Journal', heading = 'Journal Locked', text = 'Your journal is private.' }) {
  const [usePassword, setUsePassword] = useState(!journal.hasFaceId);
  const [password, setPassword] = useState('');
  const { error, busy, run } = useAsync();
  return (
    <Screen title={title}>
      <Empty icon={<IoLockClosed />} title={heading} text={text} />
      {journal.hasFaceId && (
        <button type="button" className="org-button org-wide" disabled={busy} onClick={() => run(journal.unlockWithFaceId)}>
          <IoScanOutline aria-hidden="true" /> Unlock with Face ID
        </button>
      )}
      {usePassword ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => journal.unlockWithPassword(password));
          }}
        >
          <Section>
            <input className="org-input" type="password" autoComplete="current-password" placeholder="Recovery password" aria-label="Recovery password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Section>
          <button type="submit" className="org-button org-wide org-secondary-button" disabled={!password || busy}>{busy ? 'Opening…' : 'Unlock with Password'}</button>
        </form>
      ) : (
        <button type="button" className="org-link org-wide-link" onClick={() => setUsePassword(true)}><IoKeyOutline aria-hidden="true" /> Use Password</button>
      )}
      {error && <p className="org-error org-error-center" role="alert">{error}</p>}
    </Screen>
  );
}

function Editor({ draft, setDraft, onSave, onClose }) {
  const canSave = draft.title.trim() !== '' || draft.text.trim() !== '';
  return (
    <Sheet
      title={draft.id ? 'Edit Entry' : 'New Entry'}
      onClose={onClose}
      leading={<button type="button" className="org-link" onClick={onClose}>Cancel</button>}
      trailing={<button type="button" className="org-link org-strong" disabled={!canSave} onClick={onSave}>Save</button>}
    >
      <Section>
        <input className="org-input" placeholder="Title (optional)" aria-label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <input className="org-input" type="date" aria-label="Date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value || draft.date })} />
      </Section>
      <Section>
        <textarea className="org-input org-textarea org-journal-text" aria-label="Text" placeholder="Write…" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
      </Section>
    </Sheet>
  );
}

export default function JournalScreen({ journal }) {
  const [search, setSearch] = useState('');
  const [reading, setReading] = useState(null);
  // The draft lives here, outside the editor, so locking never loses it.
  const [draft, setDraft] = useState(null);
  const { error, busy, run } = useAsync();

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const matches = (text) => (text ?? '').toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu, '').includes(query.normalize('NFD').replace(/\p{M}/gu, ''));
    return [...journal.entries]
      .filter((e) => !query || matches(e.title) || matches(e.text))
      .sort((a, b) => b.writtenOn - a.writtenOn || b.createdAt - a.createdAt);
  }, [journal.entries, search]);

  if (journal.status === 'loading') return null;
  if (journal.status === 'setup') return <Setup journal={journal} />;
  if (journal.status !== 'unlocked') return <Locked journal={journal} />;

  const startNew = () => setDraft({ id: null, title: '', text: '', date: dayInput(appleSeconds()) });
  const startEdit = (entry) => setDraft({ id: entry.id, title: entry.title ?? '', text: entry.text ?? '', date: dayInput(entry.writtenOn) });

  const saveDraft = () =>
    run(async () => {
      const now = appleSeconds();
      const existing = journal.entries.find((e) => e.id === draft.id);
      const entry = {
        ...(existing ?? { id: newId(), createdAt: now }),
        title: draft.title.trim(),
        text: draft.text.trim(),
        writtenOn: fromDayInput(draft.date),
        updatedAt: now,
      };
      await journal.saveEntries(existing ? journal.entries.map((e) => (e.id === entry.id ? entry : e)) : [...journal.entries, entry]);
      setDraft(null);
      if (reading?.id === entry.id) setReading(entry);
    });

  const remove = (entry) => {
    if (!window.confirm(`Delete “${heading(entry)}”?`)) return;
    run(async () => {
      await journal.saveEntries(journal.entries.filter((e) => e.id !== entry.id));
      setReading(null);
    });
  };

  return (
    <Screen
      title="Journal"
      leading={<button type="button" className="org-icon-button" aria-label="Lock Journal" onClick={journal.lockNow}><IoLockClosedOutline /></button>}
      trailing={<button type="button" className="org-icon-button" aria-label="New Entry" onClick={startNew}><IoAdd /></button>}
    >
      {!journal.hasFaceId && passkeysSupported() && (
        <button type="button" className="org-banner" disabled={busy} onClick={() => run(journal.enableFaceId)}>
          <IoScanOutline aria-hidden="true" />
          <span><strong>Turn On Face ID</strong><small>Open the journal with your face instead of the password.</small></span>
        </button>
      )}
      {error && <p className="org-error" role="alert">{error}</p>}
      {journal.entries.length > 0 && (
        <div className="org-section">
          <input className="org-search" type="search" placeholder="Search" aria-label="Search journal" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}
      {journal.entries.length === 0 ? (
        <Empty
          icon={<IoJournalOutline />}
          title="No Entries Yet"
          text="Your thoughts, essays and notes. Only you can open this journal."
          action={<button type="button" className="org-button" onClick={startNew}>New Entry</button>}
        />
      ) : visible.length === 0 ? (
        <Empty icon={<IoJournalOutline />} title="No Results" text={`Nothing matches “${search}”.`} />
      ) : (
        <Section>
          {visible.map((entry) => (
            <button key={entry.id} type="button" className="org-row" onClick={() => setReading(entry)}>
              <span className="org-row-main">
                <strong className="org-entry-title">{heading(entry)}</strong>
                <small>{shortDate(entry.writtenOn)}</small>
                {entry.title && entry.text && <small className="org-entry-preview">{entry.text}</small>}
              </span>
            </button>
          ))}
        </Section>
      )}

      {reading && !draft && (
        <Sheet
          title=""
          onClose={() => setReading(null)}
          leading={<button type="button" className="org-link" onClick={() => setReading(null)}>Close</button>}
          trailing={<button type="button" className="org-link" onClick={() => startEdit(reading)}>Edit</button>}
        >
          <article className="org-entry">
            <p className="org-muted">{longDate(reading.writtenOn)}</p>
            {reading.title && <h2>{reading.title}</h2>}
            <p className="org-prewrap">{reading.text}</p>
          </article>
          <Section>
            <button type="button" className="org-row org-destructive" onClick={() => remove(reading)}>Delete Entry</button>
          </Section>
        </Sheet>
      )}
      {draft && <Editor draft={draft} setDraft={setDraft} onSave={saveDraft} onClose={() => setDraft(null)} />}
    </Screen>
  );
}
