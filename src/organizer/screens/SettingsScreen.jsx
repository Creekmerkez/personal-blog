import { useRef, useState } from 'react';
import { IoAdd, IoRemove, IoDownloadOutline, IoCloudUploadOutline } from 'react-icons/io5';
import { useOrganizer } from '../lib/context';
import { appleSeconds, dateFromAppleSeconds, dayKeyFromDate } from '../lib/dates';
import { serialize, summarize, validateBackup } from '../lib/backup';
import { isEncrypted, open, seal } from '../lib/crypto';
import { Screen, Section, Toggle } from '../components/ui';
import PasswordSheet from './PasswordSheet';

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

export default function SettingsScreen({ prepareExport, applyImport, journal }) {
  const { data, settings, updateSettings } = useOrganizer();
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

  const confirmAndApply = async (text) => {
    const backup = validateBackup(JSON.parse(text));
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
          journal.status === 'setup'
            ? 'Create your Journal first: the lock uses its password and Face ID.'
            : 'Asks for Face ID or your journal password every time you open the organizer, like the Journal does.'
        }
      >
        <Toggle label="Lock Organizer" checked={settings.appLock === true} disabled={journal.status === 'setup'} onChange={setAppLock} />
      </Section>

      <Section header="Word of the Day" footer="This many words go round and round. A word you remember three times is learned and makes room for the next one. A word you don't remember comes back after a few cards.">
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
        footer="Your data is stored only on this iPhone, never on a server. Export saves all of it to one file protected by a password you choose. Keep the file in a private place, such as a Google Drive folder you never share. Import replaces everything in the app with the contents of such a file."
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

      <Section header="On this iPhone">
        <div className="org-row org-labeled"><span>Tasks</span><span className="org-value">{data.myTasks.length}</span></div>
        <div className="org-row org-labeled"><span>Words</span><span className="org-value">{data.words.length}</span></div>
      </Section>

      {passwordMode === 'create' && <PasswordSheet mode="create" onSubmit={exportWithPassword} onClose={() => setPasswordMode(null)} />}
      {passwordMode === 'enter' && (
        <PasswordSheet mode="enter" onSubmit={openWithPassword} onClose={() => { setPasswordMode(null); setPendingText(null); }} />
      )}
    </Screen>
  );
}
