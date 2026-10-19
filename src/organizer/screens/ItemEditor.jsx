import { useState } from 'react';
import { appleSeconds, dateFromAppleSeconds, dateFromDayKey, dayKeyFromDate } from '../lib/dates';
import { newId } from '../lib/backup';
import { Section, Segmented, Sheet } from '../components/ui';

// Dates are stored like the iPhone app: seconds since 2001, at noon local time.
const toInput = (seconds) => {
  if (seconds == null) return '';
  const key = dayKeyFromDate(dateFromAppleSeconds(seconds));
  return `${Math.floor(key / 10000)}-${String(Math.floor(key / 100) % 100).padStart(2, '0')}-${String(key % 100).padStart(2, '0')}`;
};
const fromInput = (text) => (text ? appleSeconds(dateFromDayKey(Number(text.replaceAll('-', '')))) : null);

/**
 * A small editor for Son entries. `fields`: [{ key, label, type: 'text' | 'textarea' | 'date' | 'status' }].
 * The first text field is required.
 */
export default function ItemEditor({ title, item, fields, defaults = {}, onSave, onDelete, onClose }) {
  const [values, setValues] = useState(() => {
    const start = { ...defaults, ...(item ?? {}) };
    return Object.fromEntries(fields.map((f) => [f.key, f.type === 'date' ? toInput(start[f.key]) : start[f.key] ?? (f.type === 'status' ? 'planned' : '')]));
  });
  const required = fields.find((f) => f.type === 'text').key;
  const canSave = String(values[required]).trim() !== '';
  const set = (key) => (value) => setValues((v) => ({ ...v, [key]: value }));

  const save = () => {
    const base = item ?? { id: newId(), createdAt: appleSeconds(), ...defaults };
    const result = { ...base };
    for (const f of fields) {
      result[f.key] = f.type === 'date' ? fromInput(values[f.key]) : typeof values[f.key] === 'string' ? values[f.key].trim() : values[f.key];
    }
    onSave(result);
  };

  return (
    <Sheet
      title={title}
      onClose={onClose}
      leading={<button type="button" className="org-link" onClick={onClose}>Cancel</button>}
      trailing={<button type="button" className="org-link org-strong" disabled={!canSave} onClick={save}>Save</button>}
    >
      {fields.map((f) => {
        if (f.type === 'text') {
          return (
            <Section key={f.key}>
              <input className="org-input" placeholder={f.label} aria-label={f.label} autoComplete="off" value={values[f.key]} onChange={(e) => set(f.key)(e.target.value)} autoFocus={!item} />
            </Section>
          );
        }
        if (f.type === 'date') {
          return (
            <Section key={f.key} header={f.label} footer="Leave empty if there is no date yet.">
              <input className="org-input" type="date" aria-label={f.label} value={values[f.key]} onChange={(e) => set(f.key)(e.target.value)} />
            </Section>
          );
        }
        if (f.type === 'status') {
          return (
            <Section key={f.key}>
              <div className="org-row">
                <Segmented label={f.label} value={values[f.key]} onChange={set(f.key)} options={[{ value: 'planned', label: 'Planned' }, { value: 'done', label: 'Done' }]} />
              </div>
            </Section>
          );
        }
        return (
          <Section key={f.key} header={f.label}>
            <textarea className="org-input org-textarea" aria-label={f.label} autoComplete="off" rows={4} value={values[f.key]} onChange={(e) => set(f.key)(e.target.value)} />
          </Section>
        );
      })}
      {item && onDelete && (
        <Section>
          <button type="button" className="org-row org-destructive" onClick={() => onDelete(item)}>Delete</button>
        </Section>
      )}
    </Sheet>
  );
}
