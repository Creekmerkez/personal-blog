import { useCallback, useState } from 'react';
import { IoCheckboxOutline, IoPeopleOutline, IoLanguageOutline, IoJournalOutline, IoSettingsOutline } from 'react-icons/io5';
import { useOrganizer } from './lib/context';
import { Empty, Screen } from './components/ui';
import TodayScreen from './screens/TodayScreen';
import SettingsScreen from './screens/SettingsScreen';
import WordsScreen from './screens/WordsScreen';
import SonScreen from './screens/SonScreen';

const TABS = [
  { id: 'today', label: 'Today', icon: IoCheckboxOutline },
  { id: 'son', label: 'Son', icon: IoPeopleOutline },
  { id: 'words', label: 'Words', icon: IoLanguageOutline },
  { id: 'journal', label: 'Journal', icon: IoJournalOutline },
  { id: 'settings', label: 'Settings', icon: IoSettingsOutline },
];

function ComingNext({ title, icon }) {
  return (
    <Screen title={title}>
      <Empty icon={icon} title="Coming next" text="This part is being moved over from the iPhone version and will appear here soon. Imported data is already kept safely." />
    </Screen>
  );
}

export default function App() {
  const { data, update } = useOrganizer();
  const [tab, setTab] = useState('today');

  const prepareExport = useCallback(async () => data, [data]);
  const applyImport = useCallback(async (backup) => update(() => backup), [update]);

  return (
    <div className="org-app">
      <main className="org-main">
        {tab === 'today' && <TodayScreen onOpenSettings={() => setTab('settings')} />}
        {tab === 'son' && <SonScreen />}
        {tab === 'words' && <WordsScreen />}
        {tab === 'journal' && <ComingNext title="Journal" icon={<IoJournalOutline />} />}
        {tab === 'settings' && <SettingsScreen prepareExport={prepareExport} applyImport={applyImport} />}
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
  );
}
