import { useMemo, useState } from 'react';
import { IoAdd, IoListOutline, IoLanguageOutline, IoStarOutline, IoCheckmark, IoClose } from 'react-icons/io5';
import { useOrganizer } from '../lib/context';
import { answerCurrent, counts, isResting, nextReturn, RECALLS_TO_LEARN, resetToLearning, rotation } from '../lib/words';
import { formatDay } from '../lib/dates';
import { Empty, Screen, Section, Segmented } from '../components/ui';
import WordEditor from './WordEditor';

function WordCard({ word, summary, onAnswer }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="org-word-card">
      <p className="org-word-count">{summary}</p>
      <div className="org-recalls" aria-label={`Remembered ${word.successfulRecalls} of ${RECALLS_TO_LEARN} times`}>
        {Array.from({ length: RECALLS_TO_LEARN }, (_, i) => (
          <span key={i} className={i < word.successfulRecalls ? 'is-on' : ''} />
        ))}
      </div>
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

const shortDay = (key) => formatDay(key, { day: 'numeric', month: 'short' });

function statusOf(word, going, today) {
  if (word.isLearned) return 'Learned';
  if (isResting(word, today)) return `Back ${shortDay(word.nextReviewDayKey)}`;
  if (going.has(word.id)) return `${word.successfulRecalls}/${RECALLS_TO_LEARN}`;
  return 'Waiting';
}

export default function WordsScreen() {
  const { data, update, settings, today } = useOrganizer();
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('learning');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // word, 'new', or null
  const [answered, setAnswered] = useState(0); // new card after every answer, even for the same word

  const words = data.words;
  const size = settings.rotationSize;
  const going = rotation(words, size, today);
  const goingIds = new Set(going.map((w) => w.id));
  const tally = counts(words, size, today);
  const comesBack = nextReturn(words, today);

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
        replaceWord(resetToLearning(w));
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
                <span className="org-value">{statusOf(w, goingIds, today)}</span>
              </button>
            ))}
          </Section>
        )}
        {listed.length > 300 && <p className="org-section-footer">Showing the newest 300. Search to find others.</p>}
        {editor}
      </Screen>
    );
  }

  return (
    <Screen
      title="Word of the Day"
      leading={<button type="button" className="org-icon-button" aria-label="All Words" onClick={() => setShowAll(true)}><IoListOutline /></button>}
      trailing={addButton}
    >
      {going.length > 0 ? (
        <WordCard
          key={`${going[0].id}-${answered}`}
          word={going[0]}
          summary={`${tally.going} in rotation · ${tally.resting} resting · ${tally.waiting} waiting · ${tally.learned} learned`}
          onAnswer={(remembered) => {
            update((d) => ({ ...d, words: answerCurrent(d.words, remembered, today, size) }));
            setAnswered((n) => n + 1);
          }}
        />
      ) : words.length === 0 ? (
        <Empty
          icon={<IoLanguageOutline />}
          title="No Words Yet"
          text="Add words you want to learn, or import your file in Settings."
          action={<button type="button" className="org-button" onClick={() => setEditing('new')}>Add Word</button>}
        />
      ) : comesBack ? (
        <Empty
          icon={<IoStarOutline />}
          title="Done for Today"
          text={`Every word in learning is resting. The next ones come back on ${formatDay(comesBack)}.`}
          action={<button type="button" className="org-button" onClick={() => setEditing('new')}>Add Word</button>}
        />
      ) : (
        <Empty
          icon={<IoStarOutline />}
          title="All Words Learned"
          text="Add new words to keep going, or put learned ones back with Learn Again in All Words."
          action={<button type="button" className="org-button" onClick={() => setEditing('new')}>Add Word</button>}
        />
      )}
      {editor}
    </Screen>
  );
}
