import { useState } from 'react';
import { IoBarbellOutline, IoChevronForward, IoWalkOutline } from 'react-icons/io5';
import { useOrganizer } from '../lib/context';
import { formatDay } from '../lib/dates';
import { byYear, entryLabel, logRun, logWorkout, nextPlan, PLAN_IDS, planItems, planTitle, shortDate } from '../lib/exercises';
import { Empty, Screen, Section, Sheet } from '../components/ui';

const planOf = (plans, id) => plans.find((p) => p.id === id) ?? { id, title: planTitle(id), items: [] };

/** Checking an exercises task: was it a run or a workout? A workout shows today's plan first. */
export function ExerciseSheet({ onDone, onClose }) {
  const { data, update, today } = useOrganizer();
  const [showWorkout, setShowWorkout] = useState(false);
  const plan = planOf(data.exercisePlans, nextPlan(data.exerciseLog));

  const run = () => {
    update((d) => ({ ...d, exerciseLog: logRun(d.exerciseLog, today) }));
    onDone();
  };
  const workout = () => {
    update((d) => ({ ...d, exerciseLog: logWorkout(d.exerciseLog, plan, today) }));
    onDone();
  };

  const close = <button type="button" className="org-link" onClick={onClose}>Cancel</button>;
  if (showWorkout) {
    return (
      <Sheet title={planTitle(plan.id)} onClose={onClose} leading={<button type="button" className="org-link" onClick={() => setShowWorkout(false)}>Back</button>}>
        {plan.items.length ? (
          <Section header={`Today · ${planTitle(plan.id)}`}>
            <ol className="org-exam-sentences">{plan.items.map((item, i) => <li key={i}>{item}</li>)}</ol>
          </Section>
        ) : (
          <p className="org-section-footer">{planTitle(plan.id)} has no exercises yet. Add them under Exercises on the Today screen.</p>
        )}
        <div className="org-section">
          <button type="button" className="org-big-button org-remembered" onClick={workout}>Done · {planTitle(plan.id)}</button>
        </div>
      </Sheet>
    );
  }
  return (
    <Sheet title="Exercises" onClose={onClose} leading={close}>
      <Section footer={`Workouts take turns: today is ${planTitle(plan.id)}.`}>
        <button type="button" className="org-row org-nav-row" onClick={run}>
          <IoWalkOutline className="org-nav-icon" aria-hidden="true" />
          <span className="org-row-main"><span>Run</span><small>Done for today</small></span>
        </button>
        <button type="button" className="org-row org-nav-row" onClick={() => setShowWorkout(true)}>
          <IoBarbellOutline className="org-nav-icon" aria-hidden="true" />
          <span className="org-row-main"><span>Workout · {planTitle(plan.id)}</span><small>{plan.items.length} exercises</small></span>
          <IoChevronForward className="org-chevron" aria-hidden="true" />
        </button>
      </Section>
    </Sheet>
  );
}

function PlanEditor({ plan, onSave, onClose }) {
  const [text, setText] = useState(plan.items.join('\n'));
  return (
    <Sheet
      title={planTitle(plan.id)}
      onClose={onClose}
      leading={<button type="button" className="org-link" onClick={onClose}>Cancel</button>}
      trailing={<button type="button" className="org-link org-strong" onClick={() => onSave({ ...plan, items: planItems(text) })}>Save</button>}
    >
      <Section header="Exercises" footer="One exercise per line, with its weight and sets — change the weight here when you go up. Past workouts keep the weights they had.">
        <textarea className="org-input org-textarea org-exam-textarea" aria-label="Exercises" autoComplete="off" rows={10} value={text} onChange={(e) => setText(e.target.value)} />
      </Section>
    </Sheet>
  );
}

/** The exercises page: the next workout, Day A and Day B, and the history by year. */
export default function ExercisesScreen({ onBack }) {
  const { data, update } = useOrganizer();
  const [editing, setEditing] = useState(null); // plan id
  const [year, setYear] = useState(null);
  const [opened, setOpened] = useState(null); // a history entry
  const years = byYear(data.exerciseLog);
  const next = nextPlan(data.exerciseLog);

  const savePlan = (plan) => {
    update((d) => ({ ...d, exercisePlans: [...PLAN_IDS.filter((id) => id !== plan.id).map((id) => planOf(d.exercisePlans, id)), plan].sort((a, b) => a.id.localeCompare(b.id)) }));
    setEditing(null);
  };

  const entrySheet = opened && (
    <Sheet title={entryLabel(opened)} onClose={() => setOpened(null)} leading={<button type="button" className="org-link" onClick={() => setOpened(null)}>Close</button>}>
      <Section header={formatDay(opened.dayKey, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}>
        {opened.text ? <ol className="org-exam-sentences">{opened.text.split('\n').map((line, i) => <li key={i}>{line}</li>)}</ol> : <p className="org-row">{opened.kind === 'run' ? 'A run.' : 'A workout.'}</p>}
      </Section>
    </Sheet>
  );

  const shown = years.find((y) => y.year === year);
  if (shown) {
    return (
      <Screen title={String(shown.year)} onBack={() => setYear(null)} backLabel="Exercises">
        <Section footer={`${shown.workouts} workouts · ${shown.runs} runs`}>
          {shown.entries.map((entry) => (
            <button key={entry.id} type="button" className="org-row" onClick={() => setOpened(entry)}>
              <span className="org-row-main"><span>{shortDate(entry.dayKey)}</span></span>
              <span className="org-value">{entryLabel(entry)}</span>
            </button>
          ))}
        </Section>
        {entrySheet}
      </Screen>
    );
  }

  return (
    <Screen title="Exercises" onBack={onBack} backLabel="Today">
      <Section header="Workouts" footer={`Next workout: ${planTitle(next)}. Day A and Day B take turns.`}>
        {PLAN_IDS.map((id) => {
          const plan = planOf(data.exercisePlans, id);
          return (
            <button key={id} type="button" className="org-row" onClick={() => setEditing(id)}>
              <span className="org-exam-badge">{id}</span>
              <span className="org-row-main"><span>{planTitle(id)}{id === next ? ' · next' : ''}</span><small>{plan.items.length ? `${plan.items.length} exercises` : 'No exercises yet'}</small></span>
              <IoChevronForward className="org-chevron" aria-hidden="true" />
            </button>
          );
        })}
      </Section>
      {years.length === 0 ? (
        <Empty icon={<IoBarbellOutline />} title="No History Yet" text="Runs and workouts you check on Today appear here. To bring in your old history, import its file in Settings." />
      ) : (
        <Section header="History">
          {years.map((y) => (
            <button key={y.year} type="button" className="org-row" onClick={() => setYear(y.year)}>
              <span className="org-row-main"><span>{y.year}</span><small>{y.workouts} workouts · {y.runs} runs</small></span>
              <IoChevronForward className="org-chevron" aria-hidden="true" />
            </button>
          ))}
        </Section>
      )}
      {editing && <PlanEditor plan={planOf(data.exercisePlans, editing)} onSave={savePlan} onClose={() => setEditing(null)} />}
      {entrySheet}
    </Screen>
  );
}
