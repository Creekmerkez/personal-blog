import { useMemo } from 'react';
import App from './App';
import { OrganizerProvider } from './lib/OrganizerProvider';
import { useToday } from './lib/useToday';
import { indexedDbStorage, memoryStorage } from './lib/storage';
import { sampleData } from './lib/sample';

/** demo: sample content in memory only (for screenshots); real data is never touched. */
export default function Root({ demo, fixedDay }) {
  const today = useToday(demo ? fixedDay : undefined);
  const storage = useMemo(() => (demo ? memoryStorage({ data: sampleData(today) }) : indexedDbStorage), [demo, today]);
  return (
    <OrganizerProvider storage={storage} today={today}>
      <App />
    </OrganizerProvider>
  );
}
