import { useMemo, useState } from 'react';
import { IoAdd, IoListOutline, IoLanguageOutline, IoCheckmarkCircleOutline, IoStarOutline, IoCheckmark, IoClose } from 'react-icons/io5';
import { useOrganizer } from '../lib/context';
import { formatDay } from '../lib/dates';
import { answer, dueWords, isNew, nextDueDay, resetToLearning } from '../lib/words';
import { Empty, Screen, Section, Segmented } from '../components/ui';
import WordEditor from './WordEditor';

function WordCard({ word, dueCount, onAnswer }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="org-word-card">
      <p className="org-word-count">{dueCount === 1 ? 'Last word for today' : `${dueCount} words due today`}</p>
      <div className="org-word-center">
        <h2 className="org-word">{word.word}</h2>
        {revealed && (
          <div className="org-word-reveal">
            <p className="org-translation">{word.translation || <span className="org-muted">No translation yet</span>}</p>
            {word.notes && <p className="org-word-notes">{word.notes}</p>}
          </div>
        )}
      </div>
      <div className="org-word-actions">
        {revealed ? (
          <>
            <button type="button" className="org-big-button org-remembered" onClick={() => onAnswer(true)}><IoCheckmark aria-hidden="true" /> Remembered</button>
            <button type="button" className="org-big-button org-forgotten" onClick={() => onAnswer(false)}><IoClose aria-hidden="true" /> Not Remembered</button>
          </>
        ) : (
          <button type="button" className="org-big-button org-primary" onClick={() => setRevealed(true)}>Show Translation</button>
        )}
      </div>
    </div>
  );
}

function statusOf(word, today) {
  if (word.isLearned) return 'Learned';
  if (isNew(word)) return 'New';
  if (word.nextReviewDayKey <= today) return 'Due today';
  return formatDay(word.nextReviewDayKey, { day: 'numeric', month: 'short' });
}

export default function WordsScreen() {
  const { data, update, settings, today } = useOrganizer();
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('learning');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // word, 'new', or null

  const words = data.words;
  const due = dueWords(words, today, settings.newWordsPerDay);

  const replaceWord = (word) =>
    update((d) => ({ ...d, words: d.words.some((w) => w.id === word.id) ? d.words.map((w) => (w.id === word.id ? word : w)) : [...d.words, word] }));

  const remove = (word) => {
    if (!window.confirm(`Delete “${word.word}” from your list?`)) return;
    update((d) => ({ ...d, words: d.words.filter((w) => w.id !== word.id) }));
    setEditing(null);
  };

  const listed = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return words
      .filter((w) => (filter === 'learning' ? !w.isLearned : filter === 'learned' ? w.isLearned : true))
      .filter((w) => !query || w.word.toLocaleLowerCase().includes(query) || (w.translation ?? '').toLocaleLowerCase().includes(query))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [words, filter, search]);

  const addButton = (
    <button type="button" className="org-icon-button" aria-label="Add Word" onClick={() => setEditing('new')}><IoAdd /></button>
  );

  const editor = editing && (
    <WordEditor
      word={editing === 'new' ? null : editing}
      today={today}
      onClose={() => setEditing(null)}
      onDelete={remove}
      onLearnAgain={(w) => {
        replaceWord(resetToLearning(w, today));
        setEditing(null);
      }}
      onSave={(w) => {
        replaceWord(w);
        setEditing(null);
      }}
    />
  );

  if (showAll) {
    return (
      <Screen title="All Words" onBack={() => setShowAll(false)} backLabel="Word of the Day" trailing={addButton}>
        <div className="org-section">
          <Segmented label="Show" value={filter} onChange={setFilter} options={[{ value: 'learning', label: 'Learning' }, { value: 'learned', label: 'Learned' }, { value: 'all', label: 'All' }]} />
        </div>
        <div className="org-section">
          <input className="org-search" type="search" placeholder="Search" aria-label="Search words" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {listed.length === 0 ? (
          <Empty icon={<IoLanguageOutline />} title="No Words" />
        ) : (
          <Section footer={`${listed.length} words`}>
            {listed.slice(0, 300).map((w) => (
              <button key={w.id} type="button" className="org-row org-word-row" onClick={() => setEditing(w)}>
                <span className="org-row-main">
                  <span>{w.word}</span>
                  <small>{w.translation || 'No translation yet'}</small>
                </span>
                <span className="org-value">{statusOf(w, today)}</span>
              </button>
            ))}
          </Section>
        )}
        {listed.length > 300 && <p className="org-section-footer">Showing the newest 300. Search to find others.</p>}
        {editor}
      </Screen>
    );
  }

  const next = due.length === 0 ? nextDueDay(words, today) : null;

  return (
    <Screen
      title="Word of the Day"
      leading={<button type="button" className="org-icon-button" aria-label="All Words" onClick={() => setShowAll(true)}><IoListOutline /></button>}
      trailing={addButton}
    >
      {due.length > 0 ? (
        <WordCard key={due[0].id} word={due[0]} dueCount={due.length} onAnswer={(remembered) => replaceWord(answer(due[0], remembered, today))} />
      ) : words.length === 0 ? (
        <Empty
          icon={<IoLanguageOutline />}
          title="No Words Yet"
          text="Add words you want to learn. One will be waiting here each day."
          action={<button type="button" className="org-button" onClick={() => setEditing('new')}>Add Word</button>}
        />
      ) : next ? (
        <Empty icon={<IoCheckmarkCircleOutline />} title="Nothing Due Today" text={`Next word on ${formatDay(next)}.`} />
      ) : (
        <Empty
          icon={<IoStarOutline />}
          title="All Words Learned"
          text="Add new words to keep going."
          action={<button type="button" className="org-button" onClick={() => setEditing('new')}>Add Word</button>}
        />
      )}
      {editor}
    </Screen>
  );
}
