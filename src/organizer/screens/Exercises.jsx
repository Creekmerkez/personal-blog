import { useState } from 'react';
import { IoBarbellOutline, IoChevronForward, IoTimeOutline, IoWalkOutline } from 'react-icons/io5';
import { useOrganizer } from '../lib/context';
import { formatDay } from '../lib/dates';
import { byYear, entryLabel, logRun, logWorkout, nextPlan, PLAN_IDS, planItems, planTitle, shortDate } from '../lib/exercises';
import { Section, Segmented, Sheet } from '../components/ui';

const planOf = (plans, id) => plans.find((p) => p.id === id) ?? { id, title: planTitle(id), items: [] };
const List = ({ lines }) => <ol className="org-exam-sentences">{lines.map((line, i) => <li key={i}>{line}</li>)}</ol>;

/**
 * Everything about exercises, opened from the task on Today: run or workout; for a
 * workout, Day A or Day B (the one whose turn it is comes selected) and its exercises;
 * editing the two days; and the history by year.
 */
export default function ExerciseSheet({ onDone, onEditTask, onClose }) {
  const { data, update, today } = useOrganizer();
  const [page, setPage] = useState('choose'); // choose | workout | edit | history | year | entry
  const [planId, setPlanId] = useState(() => nextPlan(data.exerciseLog));
  const [draft, setDraft] = useState('');
  const [year, setYear] = useState(null);
  const [entry, setEntry] = useState(null);
  const plan = planOf(data.exercisePlans, planId);
  const years = byYear(data.exerciseLog);

  const run = () => {
    update((d) => ({ ...d, exerciseLog: logRun(d.exerciseLog, today) }));
    onDone();
  };
  const workout = () => {
    update((d) => ({ ...d, exerciseLog: logWorkout(d.exerciseLog, plan, today) }));
    onDone();
  };
  const savePlan = () => {
    const edited = { ...plan, items: planItems(draft) };
    update((d) => ({ ...d, exercisePlans: PLAN_IDS.map((id) => (id === edited.id ? edited : planOf(d.exercisePlans, id))) }));
    setPage('workout');
  };

  const link = (label, action) => <button type="button" className="org-link" onClick={action}>{label}</button>;

  if (page === 'workout') {
    return (
      <Sheet title="Workout" onClose={onClose} leading={link('Back', () => setPage('choose'))} trailing={link('Edit', () => { setDraft(plan.items.join('\n')); setPage('edit'); })}>
        <div className="org-section">
          <Segmented label="Day" value={planId} onChange={setPlanId} options={PLAN_IDS.map((id) => ({ value: id, label: planTitle(id) }))} />
        </div>
        <Section footer={planId === nextPlan(data.exerciseLog) ? `It's ${planTitle(planId)}'s turn today.` : `Today is ${planTitle(nextPlan(data.exerciseLog))}'s turn, but you can choose ${planTitle(planId)}.`}>
          {plan.items.length ? <List lines={plan.items} /> : <p className="org-row org-muted">No exercises yet. Tap Edit to add them.</p>}
        </Section>
        <div className="org-section">
          <button type="button" className="org-big-button org-remembered" onClick={workout}>Done · {planTitle(planId)}</button>
        </div>
      </Sheet>
    );
  }

  if (page === 'edit') {
    return (
      <Sheet title={planTitle(planId)} onClose={onClose} leading={link('Cancel', () => setPage('workout'))} trailing={<button type="button" className="org-link org-strong" onClick={savePlan}>Save</button>}>
        <Section header="Exercises" footer="One exercise per line, with its weight and sets. Change the weight here when you go up; past workouts keep the weights they had.">
          <textarea className="org-input org-textarea org-exam-textarea" aria-label="Exercises" autoComplete="off" rows={10} value={draft} onChange={(e) => setDraft(e.target.value)} />
        </Section>
      </Sheet>
    );
  }

  if (page === 'entry' && entry) {
    return (
      <Sheet title={entryLabel(entry)} onClose={onClose} leading={link('Back', () => setPage('year'))}>
        <Section header={formatDay(entry.dayKey, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}>
          {entry.text ? <List lines={entry.text.split('\n')} /> : <p className="org-row">{entry.kind === 'run' ? 'A run.' : 'A workout.'}</p>}
        </Section>
      </Sheet>
    );
  }

  const shown = years.find((y) => y.year === year);
  if (page === 'year' && shown) {
    return (
      <Sheet title={String(shown.year)} onClose={onClose} leading={link('Back', () => setPage('history'))}>
        <Section footer={`${shown.workouts} workouts · ${shown.runs} runs`}>
          {shown.entries.map((e) => (
            <button key={e.id} type="button" className="org-row" onClick={() => { setEntry(e); setPage('entry'); }}>
              <span className="org-row-main"><span>{shortDate(e.dayKey)}</span></span>
              <span className="org-value">{entryLabel(e)}</span>
            </button>
          ))}
        </Section>
      </Sheet>
    );
  }

  if (page === 'history') {
    return (
      <Sheet title="History" onClose={onClose} leading={link('Back', () => setPage('choose'))}>
        {years.length === 0 ? (
          <p className="org-section-footer">No runs or workouts yet. To bring in your old history, import its file in Settings.</p>
        ) : (
          <Section>
            {years.map((y) => (
              <button key={y.year} type="button" className="org-row" onClick={() => { setYear(y.year); setPage('year'); }}>
                <span className="org-row-main"><span>{y.year}</span><small>{y.workouts} workouts · {y.runs} runs</small></span>
                <IoChevronForward className="org-chevron" aria-hidden="true" />
              </button>
            ))}
          </Section>
        )}
      </Sheet>
    );
  }

  return (
    <Sheet title="Exercises" onClose={onClose} leading={link('Cancel', onClose)}>
      <Section>
        <button type="button" className="org-row org-nav-row" onClick={run}>
          <IoWalkOutline className="org-nav-icon" aria-hidden="true" />
          <span className="org-row-main"><span>Run</span><small>Done for today</small></span>
        </button>
        <button type="button" className="org-row org-nav-row" onClick={() => setPage('workout')}>
          <IoBarbellOutline className="org-nav-icon" aria-hidden="true" />
          <span className="org-row-main"><span>Workout</span><small>Today: {planTitle(nextPlan(data.exerciseLog))}</small></span>
          <IoChevronForward className="org-chevron" aria-hidden="true" />
        </button>
      </Section>
      <Section>
        <button type="button" className="org-row org-nav-row" onClick={() => setPage('history')}>
          <IoTimeOutline className="org-nav-icon" aria-hidden="true" />
          <span className="org-row-main"><span>History</span><small>{years.reduce((n, y) => n + y.workouts, 0)} workouts · {years.reduce((n, y) => n + y.runs, 0)} runs</small></span>
          <IoChevronForward className="org-chevron" aria-hidden="true" />
        </button>
        <button type="button" className="org-row org-action" onClick={onEditTask}>Edit Task</button>
      </Section>
    </Sheet>
  );
}
