import { useMemo, useRef, useState } from 'react';
import { IoLockClosed, IoLockClosedOutline, IoAdd, IoJournalOutline, IoScanOutline, IoKeyOutline, IoImageOutline, IoClose } from 'react-icons/io5';
import { appleSeconds, dateFromAppleSeconds, dateFromDayKey, dayKeyFromDate } from '../lib/dates';
import { newId } from '../lib/backup';
import { MIN_PASSWORD_LENGTH } from '../lib/crypto';
import { passkeysSupported } from '../lib/passkey';
import { photoFromFile } from '../lib/photos';
import { entryIn, LANGUAGES, TRANSLATED, textHash, translationsStale } from '../lib/journalFile';
import { useOrganizer } from '../lib/context';
import { Empty, Screen, Section, Segmented, Sheet } from '../components/ui';

const dayInput = (seconds) => {
  const key = dayKeyFromDate(dateFromAppleSeconds(seconds));
  return `${Math.floor(key / 10000)}-${String(Math.floor(key / 100) % 100).padStart(2, '0')}-${String(key % 100).padStart(2, '0')}`;
};
const fromDayInput = (text) => appleSeconds(dateFromDayKey(Number(text.replaceAll('-', ''))));
const entryDate = (entry) =>
  dateFromAppleSeconds(entry.writtenOn).toLocaleString('en-GB', entry.hasTime ? { dateStyle: 'full', timeStyle: 'short' } : { dateStyle: 'full' });
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
  const [withPassword, setWithPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [repeated, setRepeated] = useState('');
  const { error, busy, run } = useAsync();
  const ok = [...password].length >= MIN_PASSWORD_LENGTH && password === repeated;
  if (!withPassword) {
    return (
      <Screen title="Journal">
        <Empty icon={<IoJournalOutline />} title="Your Journal" text="Thoughts, essays and notes. They stay on this iPhone and open like the rest of the organizer." />
        {error && <p className="org-error" role="alert">{error}</p>}
        <button type="button" className="org-button org-wide" disabled={busy} onClick={() => run(journal.setupOpen)}>Start Journal</button>
        <button type="button" className="org-link org-wide-link" onClick={() => setWithPassword(true)}><IoKeyOutline aria-hidden="true" /> Protect with a password instead</button>
      </Screen>
    );
  }
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
export function Locked({ journal, title = 'Journal', heading = 'Journal Locked', text = 'Your journal is private.', onReset, onTurnOff }) {
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
      {onTurnOff && journal.hasFaceId && (
        <button type="button" className="org-link org-wide-link" disabled={busy} onClick={() => run(onTurnOff)}>Open without Face ID from now on</button>
      )}
      {onReset && (
        <button type="button" className="org-link org-wide-link org-muted-link" disabled={busy} onClick={() => run(onReset)}>Forgot the password? Start over</button>
      )}
    </Screen>
  );
}

const isLink = (photo) => photo.startsWith('https://');

/**
 * A photo kept in the entry, or one from a link. A linked photo is fetched from
 * its site, so the link is shown too, and alone if the photo can't be loaded.
 */
function EntryPhoto({ url }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="org-entry-photo">
      {!failed && <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />}
      {isLink(url) && <figcaption><a href={url} target="_blank" rel="noopener noreferrer">{failed ? 'Photo could not be loaded. Open link' : 'Open photo'}</a></figcaption>}
    </figure>
  );
}

const LANGUAGE_OPTIONS = LANGUAGES.map(({ id, label }) => ({ value: id, label }));

function Editor({ draft, setDraft, onSave, onClose, onPicker }) {
  const canSave = draft.title.trim() !== '' || draft.text.trim() !== '';
  // The entry's own title and text are Ukrainian; EN and CZ edit its translations.
  const current = draft.lang === 'uk' ? { title: draft.title, text: draft.text } : (draft.translations[draft.lang] ?? { title: '', text: '' });
  const setCurrent = (patch) =>
    setDraft((d) =>
      d.lang === 'uk'
        ? { ...d, ...patch }
        : { ...d, translations: { ...d.translations, [d.lang]: { title: '', text: '', ...d.translations[d.lang], ...patch } }, translationsEdited: true },
    );
  const fileInput = useRef(null);
  const [adding, setAdding] = useState(false);

  const pick = () => {
    onPicker(true);
    fileInput.current?.click();
  };
  const addPhotos = async (event) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    onPicker(false);
    if (files.length === 0) return;
    setAdding(true);
    try {
      const photos = [];
      for (const file of files) photos.push(await photoFromFile(file));
      setDraft((d) => ({ ...d, photos: [...d.photos, ...photos] }));
    } catch (err) {
      window.alert(err.message);
    } finally {
      setAdding(false);
    }
  };
  const removePhoto = (index) => {
    if (window.confirm('Remove this photo from the entry?')) setDraft((d) => ({ ...d, photos: d.photos.filter((_, i) => i !== index) }));
  };

  return (
    <Sheet
      title={draft.id ? 'Edit Entry' : 'New Entry'}
      onClose={onClose}
      leading={<button type="button" className="org-link" onClick={onClose}>Cancel</button>}
      trailing={<button type="button" className="org-link org-strong" disabled={!canSave} onClick={onSave}>Save</button>}
    >
      <div className="org-section">
        <Segmented label="Language" value={draft.lang} onChange={(lang) => setDraft((d) => ({ ...d, lang }))} options={LANGUAGE_OPTIONS} />
      </div>
      <Section>
        <input className="org-input" placeholder="Title (optional)" aria-label="Title" value={current.title} onChange={(e) => setCurrent({ title: e.target.value })} />
        <input className="org-input" type="date" aria-label="Date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value || d.date }))} />
      </Section>
      <Section footer={draft.lang === 'uk' ? null : 'Translation of the Ukrainian text. Leave it empty if there is none yet.'}>
        <textarea className="org-input org-textarea org-journal-text" aria-label="Text" placeholder={draft.lang === 'uk' ? 'Write…' : 'Translation…'} value={current.text} onChange={(e) => setCurrent({ text: e.target.value })} />
      </Section>
      <Section header="Photos" footer="Photos you add are made smaller and kept in the encrypted journal on this iPhone.">
        {draft.photos.length > 0 && (
          <div className="org-row org-photo-grid">
            {draft.photos.map((photo, index) => (
              // Photos have no ids; the same one may even be added twice, so the position is the key.
              <div key={index} className="org-photo-thumb">
                <img src={photo} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.hidden = true; }} />
                <button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => removePhoto(index)}><IoClose /></button>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="org-row org-action" disabled={adding} onClick={pick}>
          <IoImageOutline aria-hidden="true" /> {adding ? 'Adding…' : 'Add Photo'}
        </button>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={addPhotos} onCancel={() => onPicker(false)} />
      </Section>
    </Sheet>
  );
}

export default function JournalScreen({ journal }) {
  const { updateSettings } = useOrganizer();
  const [search, setSearch] = useState('');
  const [reading, setReading] = useState(null);
  // The draft lives here, outside the editor, so locking never loses it.
  const [draft, setDraft] = useState(null);
  const [order, setOrder] = useState('newest');
  const [lang, setLang] = useState('uk'); // language entries are read in
  const { error, busy, run } = useAsync();

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const matches = (text) => (text ?? '').toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu, '').includes(query.normalize('NFD').replace(/\p{M}/gu, ''));
    return [...journal.entries]
      .filter((e) => !query || matches(e.title) || matches(e.text))
      .sort((a, b) => (b.writtenOn - a.writtenOn || b.createdAt - a.createdAt) * (order === 'newest' ? 1 : -1));
  }, [journal.entries, search, order]);

  // Entries under a heading for each year, in the chosen order.
  const years = useMemo(() => {
    const groups = [];
    for (const entry of visible) {
      const year = dateFromAppleSeconds(entry.writtenOn).getFullYear();
      if (groups.at(-1)?.year !== year) groups.push({ year, entries: [] });
      groups.at(-1).entries.push(entry);
    }
    return groups;
  }, [visible]);

  if (journal.status === 'loading') return null;
  if (journal.status === 'setup') return <Setup journal={journal} />;
  if (journal.status !== 'unlocked') {
    const startOver = async () => {
      if (!window.confirm('Delete the journal and all its entries, and start a new one without a lock?\n\nThis cannot be undone. Entries in a backup file can be imported again afterwards.')) return;
      await journal.reset();
      await journal.setupOpen();
    };
    // One last Face ID, then the journal opens like the rest of the app (also in Settings → Journal Lock).
    const turnOff = async () => {
      await journal.unlockWithFaceId();
      await journal.removeLock();
      updateSettings({ appLock: false });
    };
    return <Locked journal={journal} onReset={startOver} onTurnOff={turnOff} />;
  }

  const startNew = () => setDraft({ id: null, title: '', text: '', date: dayInput(appleSeconds()), photos: [], translations: {}, lang: 'uk' });
  const startEdit = (entry) =>
    setDraft({
      id: entry.id, title: entry.title ?? '', text: entry.text ?? '', date: dayInput(entry.writtenOn), photos: entry.photos ?? [],
      translations: entry.translations ?? {}, lang: entryIn(entry, lang) ? lang : 'uk',
    });

  const saveDraft = () =>
    run(async () => {
      const now = appleSeconds();
      const existing = journal.entries.find((e) => e.id === draft.id);
      // Keep an entry's exact time unless its day was changed.
      const sameDay = existing && draft.date === dayInput(existing.writtenOn);
      const title = draft.title.trim();
      const text = draft.text.trim();
      const translations = {};
      for (const code of TRANSLATED) {
        const t = draft.translations[code];
        if (t?.text?.trim()) translations[code] = { title: (t.title ?? '').trim(), text: t.text.trim() };
      }
      const hasTranslations = Object.keys(translations).length > 0;
      const entry = {
        ...(existing ?? { id: newId(), createdAt: now }),
        title,
        text,
        translations: hasTranslations ? translations : undefined,
        // Translations edited now match this Ukrainian; untouched ones keep what they were made from.
        translatedFrom: hasTranslations ? (draft.translationsEdited || !existing?.translatedFrom ? textHash(title, text) : existing.translatedFrom) : undefined,
        writtenOn: sameDay ? existing.writtenOn : fromDayInput(draft.date),
        hasTime: sameDay ? existing.hasTime : false,
        photos: draft.photos,
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
      leading={journal.isOpen ? null : <button type="button" className="org-icon-button" aria-label="Lock Journal" onClick={journal.lockNow}><IoLockClosedOutline /></button>}
      trailing={<button type="button" className="org-icon-button" aria-label="New Entry" onClick={startNew}><IoAdd /></button>}
    >
      {!journal.isOpen && !journal.hasFaceId && passkeysSupported() && (
        <button type="button" className="org-banner" disabled={busy} onClick={() => run(journal.enableFaceId)}>
          <IoScanOutline aria-hidden="true" />
          <span><strong>Turn On Face ID</strong><small>Open the journal with your face instead of the password.</small></span>
        </button>
      )}
      {error && <p className="org-error" role="alert">{error}</p>}
      {journal.entries.length > 0 && (
        <div className="org-section org-journal-tools">
          <input className="org-search" type="search" placeholder="Search" aria-label="Search journal" value={search} onChange={(e) => setSearch(e.target.value)} />
          {journal.entries.length > 1 && (
            <Segmented label="Order" value={order} onChange={setOrder} options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }]} />
          )}
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
        years.map(({ year, entries }) => (
          <Section key={year} header={`${year} · ${entries.length}`}>
            {entries.map((entry) => (
              <button key={entry.id} type="button" className="org-row" onClick={() => setReading(entry)}>
                <span className="org-row-main">
                  <strong className="org-entry-title">{heading(entry)}</strong>
                  <small>{shortDate(entry.writtenOn)}{entry.photos?.length ? ` · ${entry.photos.length} ${entry.photos.length === 1 ? 'photo' : 'photos'}` : ''}</small>
                  {entry.title && entry.text && <small className="org-entry-preview">{entry.text}</small>}
                </span>
              </button>
            ))}
          </Section>
        ))
      )}

      {reading && !draft && (
        <Sheet
          title=""
          onClose={() => setReading(null)}
          leading={<button type="button" className="org-link" onClick={() => setReading(null)}>Close</button>}
          trailing={<button type="button" className="org-link" onClick={() => startEdit(reading)}>Edit</button>}
        >
          {reading.translations && (
            <div className="org-section">
              <Segmented label="Language" value={lang} onChange={setLang} options={LANGUAGE_OPTIONS} />
            </div>
          )}
          <article className="org-entry">
            <p className="org-muted">{entryDate(reading)}</p>
            {(() => {
              const shown = entryIn(reading, reading.translations ? lang : 'uk');
              if (!shown) return <p className="org-muted">No translation yet. Tap Edit to add one.</p>;
              return (
                <>
                  {lang !== 'uk' && translationsStale(reading) && <p className="org-muted">Translated from an earlier version of the Ukrainian text.</p>}
                  {shown.title && <h2>{shown.title}</h2>}
                  <p className="org-prewrap">{shown.text}</p>
                </>
              );
            })()}
            {reading.photos?.map((url) => <EntryPhoto key={url} url={url} />)}
          </article>
          <Section>
            <button type="button" className="org-row org-destructive" onClick={() => remove(reading)}>Delete Entry</button>
          </Section>
        </Sheet>
      )}
      {draft && <Editor draft={draft} setDraft={setDraft} onSave={saveDraft} onClose={() => setDraft(null)} onPicker={journal.holdForPicker} />}
    </Screen>
  );
}
