import { useState } from 'react';
import { appleSeconds, dayKeyFromDate } from '../lib/dates';
import { newId } from '../lib/backup';
import { draftFromMask, EVERY_DAY, maskFromDraft, summary } from '../lib/weekdays';
import { scheduleSummary } from '../lib/tasks';
import WeekdayPicker from '../components/WeekdayPicker';
import { Section, Segmented, Sheet, Toggle } from '../components/ui';

/** Add (task = null) or edit a task. Works on a draft, so Cancel discards everything. */
const toInput = (key) => `${Math.floor(key / 10000)}-${String(Math.floor(key / 100) % 100).padStart(2, '0')}-${String(key % 100).padStart(2, '0')}`;
const fromInput = (text) => Number(text.replaceAll('-', ''));

export default function TaskEditor({ task, sortOrder, onSave, onDelete, onClose }) {
  const [name, setName] = useState(task?.name ?? '');
  const [flag, setFlag] = useState(task?.flag ?? 'green');
  const [draft, setDraft] = useState(() => {
    const today = dayKeyFromDate();
    const monthDay = task?.monthDay ?? 1;
    if (task?.onceDayKey != null) return { mode: 'once', onDays: 0, exceptDays: 0, onceDay: task.onceDayKey, monthDay };
    if (task?.monthDay != null) return { mode: 'monthly', onDays: 0, exceptDays: 0, onceDay: today, monthDay };
    return { ...draftFromMask(task?.weekdayMask ?? EVERY_DAY), onceDay: today, monthDay };
  });
  const [details, setDetails] = useState(task?.details ?? '');
  const [isActive, setIsActive] = useState(task?.isActive ?? true);

  const mask = maskFromDraft(draft);
  const canSave = name.trim() !== '' && mask !== 0;

  const save = () => {
    const base = task ?? {
      id: newId(),
      completionCount: 0,
      lastCompletedDayKey: null,
      sortOrder,
      createdAt: appleSeconds(),
    };
    onSave({
      ...base,
      name: name.trim(),
      flag,
      weekdayMask: mask,
      onceDayKey: draft.mode === 'once' ? draft.onceDay : null,
      monthDay: draft.mode === 'monthly' ? draft.monthDay : null,
      details: details.trim(),
      isActive,
    });
  };

  return (
    <Sheet
      title={task ? 'Edit Task' : 'New Task'}
      onClose={onClose}
      leading={<button type="button" className="org-link" onClick={onClose}>Cancel</button>}
      trailing={<button type="button" className="org-link org-strong" disabled={!canSave} onClick={save}>Save</button>}
    >
      <Section>
        <input className="org-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" autoFocus={!task} />
      </Section>
      <Section footer="Green is something you want to do. Red is something you want to keep track of.">
        <div className="org-row">
          <Segmented label="Type" value={flag} onChange={setFlag} options={[{ value: 'green', label: 'Green' }, { value: 'red', label: 'Red' }]} />
        </div>
      </Section>
      <Section
        header="Repeats"
        footer={
          draft.mode === 'once'
            ? 'Shows on Today on this day only, and not again after it.'
            : draft.mode === 'monthly'
              ? scheduleSummary({ monthDay: draft.monthDay })
              : mask === 0 ? 'Choose at least one day.' : summary(mask)
        }
      >
        <div className="org-row">
          <Segmented
            label="Repeats"
            value={draft.mode}
            onChange={(mode) => setDraft({ ...draft, mode })}
            options={[
              { value: 'everyDay', label: 'Daily' },
              { value: 'onDays', label: 'On days' },
              { value: 'exceptDays', label: 'Except' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'once', label: 'Once' },
            ]}
          />
        </div>
        {draft.mode === 'onDays' && (
          <div className="org-row"><WeekdayPicker mask={draft.onDays} onChange={(onDays) => setDraft({ ...draft, onDays })} /></div>
        )}
        {draft.mode === 'monthly' && (
          <div className="org-row">
            <div className="org-month-days" role="radiogroup" aria-label="Day of the month">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  type="button"
                  role="radio"
                  aria-checked={draft.monthDay === day}
                  className={draft.monthDay === day ? 'is-on' : ''}
                  onClick={() => setDraft({ ...draft, monthDay: day })}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}
        {draft.mode === 'once' && (
          <input
            className="org-input"
            type="date"
            aria-label="Day"
            value={toInput(draft.onceDay)}
            onChange={(e) => e.target.value && setDraft({ ...draft, onceDay: fromInput(e.target.value) })}
          />
        )}
        {draft.mode === 'exceptDays' && (
          <div className="org-row"><WeekdayPicker mask={draft.exceptDays} onChange={(exceptDays) => setDraft({ ...draft, exceptDays })} /></div>
        )}
      </Section>
      <Section header="Details" footer="Shown when you open the task, not on the Today list.">
        <textarea className="org-input org-textarea" value={details} onChange={(e) => setDetails(e.target.value)} aria-label="Details" rows={5} />
      </Section>
      {task && (
        <>
          <Section footer="Turn off to pause the task. Its counter is kept.">
            <Toggle label="Show on Today" checked={isActive} onChange={setIsActive} />
          </Section>
          <Section>
            <button type="button" className="org-row org-destructive" onClick={() => onDelete(task)}>Delete Task</button>
          </Section>
        </>
      )}
    </Sheet>
  );
}
