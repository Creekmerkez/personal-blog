import { contains, DISPLAY_ORDER, longName, shortName, toggleDay } from '../lib/weekdays';

export default function WeekdayPicker({ mask, onChange }) {
  return (
    <div className="org-weekdays">
      {DISPLAY_ORDER.map((day) => {
        const on = contains(mask, day);
        return (
          <button
            key={day}
            type="button"
            className={on ? 'is-on' : ''}
            aria-pressed={on}
            aria-label={longName(day)}
            onClick={() => onChange(toggleDay(mask, day))}
          >
            {shortName(day)}
          </button>
        );
      })}
    </div>
  );
}
