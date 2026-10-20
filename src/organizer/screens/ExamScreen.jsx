import { useEffect, useState } from 'react';
import { IoAdd, IoCheckmark, IoCheckmarkCircle, IoChevronForward, IoSchoolOutline } from 'react-icons/io5';
import { useOrganizer } from '../lib/context';
import { appleSeconds, formatDay } from '../lib/dates';
import { newId } from '../lib/backup';
import { byNumber, lastPractised, nextNumber, practisedToday, sentences, starterTopics, togglePractised, topicForToday } from '../lib/exam';
import { Empty, Screen, Section, Segmented, Sheet } from '../components/ui';

const shortDay = (key) => formatDay(key, { day: 'numeric', month: 'short' });

function practiceNote(topic, today) {
  if (practisedToday(topic, today)) return 'Practised today';
  const last = lastPractised(topic);
  return last ? `Last practised ${shortDay(last)}` : 'Not practised yet';
}

/** Add (topic = null) or edit a topic: its title and its sentences, one per line. */
function TopicEditor({ topic, number, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(topic?.title ?? '');
  const [text, setText] = useState(topic?.text ?? '');
  const canSave = title.trim() !== '' && text.trim() !== '';
  const save = () => {
    const base = topic ?? { id: newId(), number, practisedOn: [], createdAt: appleSeconds() };
    onSave({ ...base, title: title.trim(), text: sentences({ text }).join('\n') });
  };
  return (
    <Sheet
      title={topic ? `№ ${topic.number}` : 'New Topic'}
      onClose={onClose}
      leading={<button type="button" className="org-link" onClick={onClose}>Cancel</button>}
      trailing={<button type="button" className="org-link org-strong" disabled={!canSave} onClick={save}>Save</button>}
    >
      <Section>
        <input className="org-input" placeholder="Topic" aria-label="Topic" autoComplete="off" value={title} onChange={(e) => setTitle(e.target.value)} data-autofocus={!topic || undefined} />
      </Section>
      <Section header="Text" footer="One sentence per line.">
        <textarea className="org-input org-textarea org-exam-textarea" aria-label="Text" autoComplete="off" rows={14} value={text} onChange={(e) => setText(e.target.value)} />
      </Section>
      {topic && (
        <Section>
          <button type="button" className="org-row org-destructive" onClick={() => onDelete(topic)}>Delete Topic</button>
        </Section>
      )}
    </Sheet>
  );
}

/** One topic to read, or to practise: each sentence hidden behind its first word until tapped. */
function Topic({ topic, today, onBack, onEdit, onToggle }) {
  const [mode, setMode] = useState('read');
  const [shown, setShown] = useState(() => new Set());
  const lines = sentences(topic);
  const done = practisedToday(topic, today);
  const days = (topic.practisedOn ?? []).length;
  const switchMode = (next) => {
    setMode(next);
    setShown(new Set());
  };
  return (
    <Screen
      title={topic.title}
      onBack={onBack}
      backLabel="Zkouška"
      trailing={<button type="button" className="org-link" onClick={onEdit}>Edit</button>}
    >
      <p className="org-exam-number">№ {topic.number}</p>
      <div className="org-section">
        <Segmented label="Mode" value={mode} onChange={switchMode} options={[{ value: 'read', label: 'Read' }, { value: 'practise', label: 'Practise' }]} />
      </div>
      <Section footer={mode === 'practise' ? 'Say each sentence, then tap it to check.' : null}>
        <ol className="org-exam-sentences">
          {lines.map((line, i) => {
            if (mode === 'read' || shown.has(i)) return <li key={i}>{line}</li>;
            return (
              <li key={i}>
                <button type="button" className="org-exam-hidden" aria-label={`Show sentence ${i + 1}`} onClick={() => setShown(new Set(shown).add(i))}>
                  {line.split(' ')[0]} …
                </button>
              </li>
            );
          })}
        </ol>
      </Section>
      <div className="org-section">
        <button type="button" className={`org-big-button ${done ? 'org-remembered' : 'org-primary'}`} aria-pressed={done} onClick={onToggle}>
          <IoCheckmark aria-hidden="true" /> {done ? 'Practised Today' : 'Mark as Practised Today'}
        </button>
        <p className="org-section-footer">
          {days === 0 ? 'Not practised yet.' : `Practised on ${days} ${days === 1 ? 'day' : 'days'}.`}
          {done && ' Tap again to take back today’s mark.'}
        </p>
      </div>
    </Screen>
  );
}

export default function ExamScreen() {
  const { data, update, settings, updateSettings, today } = useOrganizer();
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null); // topic, 'new', or null
  const topics = byNumber(data.examTopics);

  // The owner's 20 topics are put in on the first visit; after that the list is entirely theirs.
  useEffect(() => {
    if (settings.examSeeded) return;
    updateSettings({ examSeeded: true });
    update((d) => (d.examTopics.length ? d : { ...d, examTopics: starterTopics() }));
  }, [settings.examSeeded, updateSettings, update]);

  const replace = (topic) =>
    update((d) => ({ ...d, examTopics: d.examTopics.some((t) => t.id === topic.id) ? d.examTopics.map((t) => (t.id === topic.id ? topic : t)) : [...d.examTopics, topic] }));

  const remove = (topic) => {
    if (!window.confirm(`Delete “${topic.title}”?`)) return;
    update((d) => ({ ...d, examTopics: d.examTopics.filter((t) => t.id !== topic.id) }));
    setEditing(null);
    setOpenId(null);
  };

  const openTopic = (id) => {
    setOpenId(id);
    window.scrollTo(0, 0);
  };

  const restore = () => update((d) => ({ ...d, examTopics: [...d.examTopics, ...starterTopics()] }));

  const editor = editing && (
    <TopicEditor
      topic={editing === 'new' ? null : editing}
      number={nextNumber(topics)}
      onClose={() => setEditing(null)}
      onDelete={remove}
      onSave={(topic) => {
        replace(topic);
        setEditing(null);
      }}
    />
  );

  const open = topics.find((t) => t.id === openId);
  if (open) {
    return (
      <>
        <Topic key={open.id} topic={open} today={today} onBack={() => setOpenId(null)} onEdit={() => setEditing(open)} onToggle={() => replace(togglePractised(open, today))} />
        {editor}
      </>
    );
  }

  const next = topicForToday(topics, today);
  const doneToday = topics.filter((t) => practisedToday(t, today)).length;
  const addButton = <button type="button" className="org-icon-button" aria-label="Add Topic" onClick={() => setEditing('new')}><IoAdd /></button>;

  return (
    <Screen title="Zkouška" trailing={addButton}>
      {topics.length === 0 ? (
        <Empty
          icon={<IoSchoolOutline />}
          title="No Topics"
          text="Add a topic, or put back the 20 exam topics."
          action={<button type="button" className="org-button" onClick={restore}>Add the 20 Topics</button>}
        />
      ) : (
        <>
          <Section header="Today" footer={`${doneToday} of ${topics.length} practised today`}>
            {next ? (
              <button type="button" className="org-row org-exam-today" onClick={() => openTopic(next.id)}>
                <span className="org-exam-badge">{next.number}</span>
                <span className="org-row-main"><span>{next.title}</span><small>{practiceNote(next, today)}</small></span>
                <IoChevronForward className="org-chevron" aria-hidden="true" />
              </button>
            ) : (
              <p className="org-row org-muted">Every topic practised today.</p>
            )}
          </Section>
          <Section header="Topics">
            {topics.map((t) => (
              <button key={t.id} type="button" className="org-row" onClick={() => openTopic(t.id)}>
                <span className="org-exam-badge">{t.number}</span>
                <span className="org-row-main"><span>{t.title}</span><small>{practiceNote(t, today)}</small></span>
                {practisedToday(t, today) && <IoCheckmarkCircle className="org-exam-done" aria-label="Practised today" />}
              </button>
            ))}
          </Section>
        </>
      )}
      {editor}
    </Screen>
  );
}
