import { useState } from 'react';
import { IoShareOutline, IoStatsChartOutline } from 'react-icons/io5';
import { useOrganizer } from '../lib/context';
import { formatDay } from '../lib/dates';
import { entryLabel } from '../lib/exercises';
import { csvFileName, historyCsv, monthDays, monthGrid, monthOf, perMonth, perWeek, perWeekday, perYear, yearOf, yearsOf } from '../lib/stats';
import { saveFile } from '../lib/share';
import { Empty, Screen, Section, Segmented } from '../components/ui';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PLOT = 112; // px, the tallest bar

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const sessions = (item) => `${plural(item.workouts, 'workout')}, ${plural(item.runs, 'run')}`;
const barHeight = (value, max) => (value ? Math.max(3, Math.round((value / max) * PLOT)) : 0);

const Legend = () => (
  <div className="org-legend" aria-hidden="true">
    <span><i className="org-key org-key-workout" />Workout</span>
    <span><i className="org-key org-key-run" />Run</span>
  </div>
);

/** Columns of stacked bars, workout at the bottom and run on top; each column is a button. */
function Columns({ items, name, describe, selected, onSelect, totals = false }) {
  const max = Math.max(1, ...items.map((i) => i.workouts + i.runs));
  return (
    <div className="org-chart">
      {items.map((item) => {
        const key = name(item);
        return (
          <button key={key} type="button" className={`org-chart-col ${selected === key ? 'is-selected' : ''}`} aria-label={describe(item)} aria-pressed={selected === key} onClick={() => onSelect(item)}>
            {totals && <span className="org-chart-total">{item.workouts + item.runs || ''}</span>}
            <span className="org-chart-stack">
              {item.runs > 0 && <span className="org-bar-run" style={{ height: barHeight(item.runs, max) }} />}
              {item.workouts > 0 && <span className="org-bar-workout" style={{ height: barHeight(item.workouts, max) }} />}
            </span>
            <span className="org-chart-label">{key}</span>
          </button>
        );
      })}
    </div>
  );
}

/** One month as a calendar: a coloured dot under each day with a run or a workout. */
function MonthCalendar({ year, month, days, today, selected, onSelect }) {
  return (
    <div className="org-cal">
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="org-cal-head" aria-hidden="true">{d}</span>)}
      {monthGrid(year, month).map((key, i) => {
        if (!key) return <span key={`blank-${i}`} />;
        const entry = days.get(key);
        const label = `${formatDay(key, { weekday: 'long', day: 'numeric', month: 'long' })}: ${entry ? entryLabel(entry) : 'nothing'}`;
        return (
          <button key={key} type="button" className={`org-cal-day ${key === today ? 'is-today' : ''} ${key === selected ? 'is-selected' : ''}`} aria-label={label} aria-pressed={key === selected} onClick={() => onSelect(key)}>
            {key % 100}
            <i className={entry ? `org-key org-key-${entry.kind}` : 'org-key'} />
          </button>
        );
      })}
    </div>
  );
}

/** Weekdays as horizontal stacked bars, with the total at the end of each. */
function Weekdays({ items }) {
  const max = Math.max(1, ...items.map((i) => i.workouts + i.runs));
  return (
    <div className="org-hbars">
      {items.map((item) => (
        <div key={item.weekday} className="org-hbar" aria-label={`${WEEKDAYS[item.weekday]}: ${sessions(item)}`} role="img">
          <span className="org-hbar-label">{WEEKDAYS[item.weekday]}</span>
          <span className="org-hbar-track">
            {item.workouts > 0 && <span className="org-bar-workout" style={{ width: `${(item.workouts / max) * 100}%` }} />}
            {item.runs > 0 && <span className="org-bar-run" style={{ width: `${(item.runs / max) * 100}%` }} />}
          </span>
          <span className="org-hbar-total">{item.workouts + item.runs}</span>
        </div>
      ))}
    </div>
  );
}

/** Workout statistics: how many runs and workouts, by year, month and weekday, and on which days. */
export default function StatsScreen({ onBack }) {
  const { data, today } = useOrganizer();
  const log = data.exerciseLog;
  const years = yearsOf(log);
  const [year, setYear] = useState(() => (years.includes(yearOf(today)) ? yearOf(today) : years.at(-1)));
  const [month, setMonth] = useState(null);
  const [day, setDay] = useState(null);

  if (!log.length) {
    return (
      <Screen title="Statistics" onBack={onBack} backLabel="Today">
        <Empty icon={<IoStatsChartOutline />} title="No Runs or Workouts Yet" text="Check the exercises task on Today, or import your old history in Settings." />
      </Screen>
    );
  }

  const months = perMonth(log, year);
  const total = months.reduce((t, m) => ({ workouts: t.workouts + m.workouts, runs: t.runs + m.runs }), { workouts: 0, runs: 0 });
  // The month shown in the calendar: the one tapped, else this month if it has anything, else the last one that does.
  const active = (m) => m.workouts + m.runs > 0;
  const lastActive = [...months].reverse().find(active)?.month ?? 1;
  const thisMonth = year === yearOf(today) ? months[monthOf(today) - 1] : null;
  const shownMonth = month ?? (thisMonth && active(thisMonth) ? thisMonth.month : lastActive);
  const days = monthDays(log, year, shownMonth);
  const picked = day && days.get(day);

  const pickYear = (next) => {
    setYear(next);
    setMonth(null);
    setDay(null);
  };
  const pickMonth = (m) => {
    setMonth(m.month);
    setDay(null);
  };

  const exportCsv = async () => {
    try {
      await saveFile(historyCsv(log), csvFileName(today), 'text/csv');
    } catch (err) {
      if (err?.name !== 'AbortError') window.alert(`The file could not be saved. ${err.message}`);
    }
  };

  return (
    <Screen title="Statistics" onBack={onBack} backLabel="Today">
      {years.length > 1 && (
        <div className="org-section">
          <Segmented label="Year" value={year} onChange={pickYear} options={years.map((y) => ({ value: y, label: String(y) }))} />
        </div>
      )}

      <div className="org-section org-tiles">
        <div className="org-tile"><strong>{total.workouts}</strong><span><i className="org-key org-key-workout" />Workouts</span></div>
        <div className="org-tile"><strong>{total.runs}</strong><span><i className="org-key org-key-run" />Runs</span></div>
        <div className="org-tile"><strong>{perWeek(log, year, today).toFixed(1)}</strong><span>A week</span></div>
      </div>

      <Section header={`By Month · ${year}`} footer="Tap a month to see its days below.">
        <div className="org-chart-box">
          <Legend />
          <Columns
            items={months}
            name={(m) => MONTHS[m.month - 1]}
            describe={(m) => `${MONTH_NAMES[m.month - 1]}: ${sessions(m)}`}
            selected={MONTHS[shownMonth - 1]}
            onSelect={pickMonth}
          />
        </div>
      </Section>

      <Section header={`${MONTH_NAMES[shownMonth - 1]} ${year}`} footer={sessions(months[shownMonth - 1])}>
        <div className="org-chart-box">
          <MonthCalendar year={year} month={shownMonth} days={days} today={today} selected={day} onSelect={(key) => setDay(key === day ? null : key)} />
          {day && (
            <div className="org-cal-detail" aria-live="polite">
              <strong>{formatDay(day, { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
              <span className="org-muted">{picked ? entryLabel(picked) : 'No run or workout'}</span>
              {picked?.text && <ol className="org-exam-sentences">{picked.text.split('\n').map((line, i) => <li key={i}>{line}</li>)}</ol>}
            </div>
          )}
        </div>
      </Section>

      <Section header={`By Weekday · ${year}`}>
        <div className="org-chart-box">
          <Legend />
          <Weekdays items={perWeekday(log, year)} />
        </div>
      </Section>

      {years.length > 1 && (
        <Section header="All Years" footer="Tap a year to see it above.">
          <div className="org-chart-box">
            <Legend />
            <Columns items={perYear(log)} name={(y) => String(y.year)} describe={(y) => `${y.year}: ${sessions(y)}`} selected={String(year)} onSelect={(y) => pickYear(y.year)} totals />
          </div>
        </Section>
      )}

      <Section footer="Every run and workout with its date, Day A or B and the exercises, for Excel, Numbers or Google Sheets.">
        <button type="button" className="org-row org-action org-export" onClick={exportCsv}>
          <IoShareOutline aria-hidden="true" /> Export History (CSV)
        </button>
      </Section>
    </Screen>
  );
}
