import { useCallback, useState } from 'react';
import { IoCheckboxOutline, IoPeopleOutline, IoLanguageOutline, IoJournalOutline, IoSettingsOutline } from 'react-icons/io5';
import { useOrganizer } from './lib/context';
import TodayScreen from './screens/TodayScreen';
import SettingsScreen from './screens/SettingsScreen';
import WordsScreen from './screens/WordsScreen';
import SonScreen from './screens/SonScreen';
import JournalScreen, { Locked } from './screens/JournalScreen';
import { useJournal } from './lib/useJournal';

const TABS = [
  { id: 'today', label: 'Today', icon: IoCheckboxOutline },
  { id: 'son', label: 'Son', icon: IoPeopleOutline },
  { id: 'words', label: 'Words', icon: IoLanguageOutline },
  { id: 'journal', label: 'Journal', icon: IoJournalOutline },
  { id: 'settings', label: 'Settings', icon: IoSettingsOutline },
];

export default function App() {
  const { data, update, storage, settings } = useOrganizer();
  const [tab, setTab] = useState('today');
  const journal = useJournal(storage);
  // With the app lock on, the journal's lock covers the whole organizer: same password and Face ID,
  // and it locks again whenever the app leaves the screen. The screens stay mounted underneath, so
  // nothing in progress is lost, but they are not drawn or read out while locked.
  const appLocked = settings.appLock === true && (journal.status === 'locked' || journal.status === 'loading');

  // The journal is stored separately and encrypted; it joins the export only
  // here, inside the password-protected file.
  const prepareExport = useCallback(async () => ({ ...data, journal: await journal.entriesForExport() }), [data, journal]);

  // A file's journal entries replace the journal only when the file has some,
  // so importing a tasks-and-words file never empties the journal.
  const applyImport = useCallback(
    async (backup) => {
      if (backup.journal.length > 0) {
        if (journal.status === 'setup') throw new Error('This file contains journal entries. Open the Journal tab and create your journal first, then import again.');
        if (journal.status !== 'unlocked') {
          if (!journal.hasFaceId) throw new Error('This file contains journal entries. Unlock the Journal first, then import again.');
          await journal.unlockWithFaceId();
        }
        await journal.saveEntries(backup.journal);
      }
      update(() => ({ ...backup, journal: [] }));
    },
    [update, journal],
  );

  // A journal file only adds entries; it never touches anything else.
  const addJournalEntries = useCallback(
    async (entries) => {
      if (journal.status === 'setup') throw new Error('Open the Journal tab and create your journal first, then import again.');
      if (journal.status !== 'unlocked') {
        if (!journal.hasFaceId) throw new Error('Unlock the Journal first, then import again.');
        await journal.unlockWithFaceId();
      }
      return journal.addEntries(entries);
    },
    [journal],
  );

  return (
    <div className="org-app">
      {appLocked && journal.status === 'locked' && (
        <main className="org-main">
          <Locked journal={journal} title="Organizer" heading="Organizer Locked" text="Unlock with Face ID or your journal password." />
        </main>
      )}
      <div hidden={appLocked}>
        <main className="org-main">
          {tab === 'today' && <TodayScreen onOpenSettings={() => setTab('settings')} />}
          {tab === 'son' && <SonScreen />}
          {tab === 'words' && <WordsScreen />}
          {tab === 'journal' && <JournalScreen journal={journal} />}
          {tab === 'settings' && <SettingsScreen prepareExport={prepareExport} applyImport={applyImport} addJournalEntries={addJournalEntries} journal={journal} />}
        </main>
        <nav className="org-tabbar" aria-label="Sections">
          {TABS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" className={tab === item.id ? 'is-active' : ''} aria-current={tab === item.id ? 'page' : undefined} onClick={() => setTab(item.id)}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
