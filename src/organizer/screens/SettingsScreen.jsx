import { useEffect, useRef, useState } from 'react';
import { IoAdd, IoRemove, IoDownloadOutline, IoCloudUploadOutline, IoLanguageOutline, IoKeyOutline, IoGlobeOutline } from 'react-icons/io5';
import { useOrganizer } from '../lib/context';
import { appleSeconds, dateFromAppleSeconds, dayKeyFromDate } from '../lib/dates';
import { serialize, summarize, validateBackup } from '../lib/backup';
import { isEncrypted, open, seal } from '../lib/crypto';
import { Screen, Section, Toggle } from '../components/ui';
import PasswordSheet from './PasswordSheet';
import { fileToTranslate, isJournalFile, journalEntriesFrom } from '../lib/journalFile';
import { BLOG_URL, checkToken, TOKEN_KEY } from '../lib/publish';

const isStandalone = () => window.navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;

/** Hands the file to the iOS share sheet (Save to Files, Google Drive…), or downloads it. */
async function saveFile(text, name) {
  const file = new File([text], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
    return;
  }
  const url = URL.createObjectURL(file);
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function SettingsScreen({ prepareExport, applyImport, addJournalEntries, journal }) {
  const { data, settings, updateSettings, storage } = useOrganizer();
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    storage.get(TOKEN_KEY).then((token) => setHasToken(Boolean(token)));
  }, [storage]);
  const [passwordMode, setPasswordMode] = useState(null); // 'create' | 'enter'
  const [readyFile, setReadyFile] = useState(null);
  const [pendingText, setPendingText] = useState(null);
  const fileInput = useRef(null);

  const fileName = `Organizer backup ${dayKeyFromDate()}.json`;

  // Turning the lock on needs one successful unlock first, so it can't lock out an owner
  // who no longer knows the journal password.
  const setAppLock = async (on) => {
    if (!on) return updateSettings({ appLock: false });
    try {
      if (journal.status !== 'unlocked') {
        if (!journal.hasFaceId) throw new Error('Open the Journal tab and unlock it with your password first, then turn the lock on.');
        await journal.unlockWithFaceId();
      }
      updateSettings({ appLock: true });
    } catch (err) {
      window.alert(err?.name === 'NotAllowedError' ? 'Face ID was cancelled.' : err.message);
    }
  };

  // The Journal lock: off means no password or Face ID, like the rest of the app.
  const journalLocked = journal.status !== 'setup' && !journal.isOpen;
  const setJournalLock = async (on) => {
    if (on) return setPasswordMode('journal');
    try {
      if (journal.status !== 'unlocked') {
        if (!journal.hasFaceId) throw new Error('Open the Journal tab and unlock it with your password first, then turn the lock off.');
        await journal.unlockWithFaceId();
      }
      if (!window.confirm('Turn off the Journal lock?\n\nThe journal will open without Face ID or a password, like the rest of the organizer.')) return;
      await journal.removeLock();
      updateSettings({ appLock: false });
    } catch (err) {
      window.alert(err?.name === 'NotAllowedError' ? 'Face ID was cancelled.' : err.message);
    }
  };

  const exportWithPassword = async (password) => {
    const plain = serialize(await prepareExport());
    setReadyFile(await seal(plain, password));
    setPasswordMode(null);
  };

  const share = async () => {
    try {
      await saveFile(readyFile, fileName);
      updateSettings({ lastExportAt: appleSeconds() });
      setReadyFile(null);
    } catch (err) {
      if (err?.name !== 'AbortError') window.alert(`The file could not be saved. ${err.message}`);
    }
  };

  // No await before sharing: iOS only opens the share sheet straight from a tap.
  const shareToTranslate = async () => {
    if (journal.status !== 'unlocked') return window.alert('Open the Journal tab and unlock it first.');
    const file = fileToTranslate(journal.entries);
    if (file.entries.length === 0) return window.alert('Every journal entry already has English and Czech.');
    try {
      await saveFile(JSON.stringify(file, null, 2), `Journal to translate ${dayKeyFromDate()}.json`);
    } catch (err) {
      if (err?.name !== 'AbortError') window.alert(`The file could not be saved. ${err.message}`);
    }
  };

  // The token publishes journal entries to the website. It stays on this iPhone and is never in a backup.
  const addToken = async () => {
    const token = window.prompt('Paste the GitHub token for jmerkusheva.com:')?.trim();
    if (!token) return;
    try {
      await checkToken(token);
      await storage.set(TOKEN_KEY, token);
      setHasToken(true);
      window.alert('Token added. Open a journal entry and turn on “Show on jmerkusheva.com” to publish it.');
    } catch (err) {
      window.alert(err.status === 401 || err.status === 404 ? 'GitHub did not accept this token. Check it was copied whole and has access to the personal-blog repository.' : err.message);
    }
  };
  const removeToken = async () => {
    if (!window.confirm('Remove the GitHub token from this iPhone?\n\nPosts already on the website stay there.')) return;
    await storage.set(TOKEN_KEY, null);
    setHasToken(false);
  };

  const confirmAndApply = async (text) => {
    const value = JSON.parse(text);
    if (isJournalFile(value)) {
      const entries = journalEntriesFrom(value);
      if (!window.confirm(`Add ${entries.length} entries to your Journal?\n\nNothing else changes. Entries already in the journal keep their text and only get missing photos and translations.`)) return;
      try {
        const { added, updated } = await addJournalEntries(entries);
        window.alert([
          `${added} new ${added === 1 ? 'entry' : 'entries'} added to your Journal.`,
          updated ? `${updated} ${updated === 1 ? 'entry' : 'entries'} got photos or translations.` : '',
        ].join(' ').trim());
      } catch (err) {
        window.alert(err?.name === 'NotAllowedError' ? 'Face ID was cancelled.' : err.message);
      }
      return;
    }
    const backup = validateBackup(value);
    const when = dateFromAppleSeconds(backup.exportedAt).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
    if (window.confirm(`Replace all data?\n\nThe file from ${when} has ${summarize(backup)}. Your tasks, Son and words in the app will be replaced${backup.journal.length ? ', and so will the journal' : '; your journal stays as it is'}.`)) {
      try {
        await applyImport(backup);
        window.alert('Your data was imported.');
      } catch (err) {
        window.alert(err.message);
      }
    }
  };

  const onPickFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      if (isEncrypted(text)) {
        setPendingText(text);
        setPasswordMode('enter');
      } else {
        await confirmAndApply(text);
      }
    } catch (err) {
      window.alert(`This file could not be read. ${err.message}`);
    }
  };

  const openWithPassword = async (password) => {
    const plain = await open(pendingText, password);
    setPasswordMode(null);
    setPendingText(null);
    await confirmAndApply(plain);
  };

  const lastExport = settings.lastExportAt ? dateFromAppleSeconds(settings.lastExportAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Never';

  return (
    <Screen title="Settings">
      {!isStandalone() && (
        <Section header="Install on this iPhone" footer="Safari only allows this from its own menu: this page cannot add itself. Import your data after opening the organizer from its new icon.">
          <ol className="org-row org-steps">
            <li>Make sure this page is open in <strong>Safari</strong>.</li>
            <li>Tap <strong>•••</strong> next to the address bar at the bottom of the screen. On older iPhones, tap the Share button in Safari&apos;s bottom bar instead.</li>
            <li>Tap <strong>Share</strong>, scroll down, and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
          </ol>
        </Section>
      )}

      <Section
        header="Privacy"
        footer={
          journalLocked
            ? 'Journal Lock asks for Face ID or a password to open the Journal. Lock Organizer asks for it every time you open the organizer.'
            : 'The Journal opens without Face ID or a password. Turn on Journal Lock to protect it, and then, if you like, the whole organizer.'
        }
      >
        <Toggle label="Journal Lock" checked={journalLocked} disabled={journal.status === 'setup' || journal.status === 'loading'} onChange={setJournalLock} />
        <Toggle label="Lock Organizer" checked={settings.appLock === true} disabled={!journalLocked} onChange={setAppLock} />
      </Section>

      <Section header="Word of the Day" footer="This many words go round and round. A word you remember three times in a row rests and comes back on a later day: after 1, 2, 4, 7, 14 and then 30 days. Remembered again after the 30-day rest, it is learned. A word you don't remember starts over as new and comes back after a few cards.">
        <div className="org-row org-labeled">
          <span>Words in rotation</span>
          <span className="org-stepper">
            <span className="org-value">{settings.rotationSize}</span>
            <button type="button" aria-label="Fewer words in rotation" disabled={settings.rotationSize <= 5} onClick={() => updateSettings({ rotationSize: settings.rotationSize - 5 })}><IoRemove /></button>
            <button type="button" aria-label="More words in rotation" disabled={settings.rotationSize >= 50} onClick={() => updateSettings({ rotationSize: settings.rotationSize + 5 })}><IoAdd /></button>
          </span>
        </div>
      </Section>

      <Section
        header="Backup"
        footer="Your data is stored only on this iPhone, never on a server. Export saves all of it to one file protected by a password you choose. Keep the file in a private place, such as a Google Drive folder you never share. Import replaces everything in the app with the contents of such a file. A journal file (entries prepared for you) only adds entries to the Journal."
      >
        {readyFile ? (
          <button type="button" className="org-row org-action" onClick={share}><IoCloudUploadOutline aria-hidden="true" /> Save Encrypted File…</button>
        ) : (
          <button type="button" className="org-row org-action" onClick={() => setPasswordMode('create')}><IoCloudUploadOutline aria-hidden="true" /> Export Data</button>
        )}
        <button type="button" className="org-row org-action" onClick={() => fileInput.current?.click()}><IoDownloadOutline aria-hidden="true" /> Import Data</button>
        <div className="org-row org-labeled"><span>Last backup</span><span className="org-value">{lastExport}</span></div>
        <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={onPickFile} />
      </Section>

      <Section
        header="Translations"
        footer="Saves the journal entries that have no English or Czech yet, or whose Ukrainian changed since, to a file. The file is not encrypted: send it only to Claude to translate, then delete it. Import the translated file Claude sends back with Import Data."
      >
        <button type="button" className="org-row org-action" disabled={journal.status === 'setup' || journal.status === 'loading'} onClick={shareToTranslate}><IoLanguageOutline aria-hidden="true" /> Share Entries to Translate…</button>
      </Section>

      <Section
        header="Website"
        footer="Lets the Journal publish entries to jmerkusheva.com/blog. On github.com create a fine-grained token for the personal-blog repository only, with Contents: Read and write, and paste it here. It stays on this iPhone and is not included in backups."
      >
        <div className="org-row org-labeled"><span>GitHub token</span><span className="org-value">{hasToken ? 'Added' : 'Not added'}</span></div>
        <button type="button" className="org-row org-action" onClick={addToken}><IoKeyOutline aria-hidden="true" /> {hasToken ? 'Replace Token…' : 'Add GitHub Token…'}</button>
        {hasToken && <button type="button" className="org-row org-destructive" onClick={removeToken}>Remove Token</button>}
        <a className="org-row org-action" href={BLOG_URL} target="_blank" rel="noreferrer"><IoGlobeOutline aria-hidden="true" /> Open the Blog</a>
      </Section>

      <Section header="On this iPhone">
        <div className="org-row org-labeled"><span>Tasks</span><span className="org-value">{data.myTasks.length}</span></div>
        <div className="org-row org-labeled"><span>Words</span><span className="org-value">{data.words.length}</span></div>
      </Section>

      {passwordMode === 'create' && <PasswordSheet mode="create" onSubmit={exportWithPassword} onClose={() => setPasswordMode(null)} />}
      {passwordMode === 'journal' && (
        <PasswordSheet
          mode="create"
          title="Journal Password"
          action="Lock"
          footer="At least 8 characters. The Journal will ask for this password; you can add Face ID in the Journal afterwards. Keep it in Passwords on your iPhone."
          onSubmit={async (password) => {
            await journal.addPassword(password);
            setPasswordMode(null);
          }}
          onClose={() => setPasswordMode(null)}
        />
      )}
      {passwordMode === 'enter' && (
        <PasswordSheet mode="enter" onSubmit={openWithPassword} onClose={() => { setPasswordMode(null); setPendingText(null); }} />
      )}
    </Screen>
  );
}
