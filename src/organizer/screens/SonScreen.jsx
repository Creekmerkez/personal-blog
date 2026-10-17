import { useState } from 'react';
import {
  IoAdd, IoCheckboxOutline, IoMedkitOutline, IoPulseOutline, IoExtensionPuzzleOutline, IoLocationOutline,
  IoChevronForward, IoCheckmarkCircle, IoEllipseOutline, IoTimeOutline, IoHomeOutline, IoCarOutline, IoSunnyOutline, IoStar,
} from 'react-icons/io5';
import { useOrganizer } from '../lib/context';
import { appleSeconds, formatStoredDate } from '../lib/dates';
import { CATEGORIES, GAMES, GAMES_TIP } from '../content/games';
import { mapsUrl, PLACE_GROUPS, PLACES } from '../content/places';
import { Empty, Screen, Section, Sheet } from '../components/ui';
import ItemEditor from './ItemEditor';

const replaceIn = (list, item) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]);
const nextOrder = (list) => list.reduce((max, x) => Math.max(max, x.sortOrder ?? 0), -1) + 1;
const firstOrder = (list) => list.reduce((min, x) => Math.min(min, x.sortOrder ?? 0), 0) - 1;

function useList(key) {
  const { data, update } = useOrganizer();
  const list = data[key];
  const save = (item) => update((d) => ({ ...d, [key]: replaceIn(d[key], item) }));
  const remove = (item, label) => {
    if (!window.confirm(`Delete “${label}”?`)) return false;
    update((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== item.id) }));
    return true;
  };
  return { list, save, remove };
}

function AddButton({ label, onClick }) {
  return <button type="button" className="org-icon-button" aria-label={label} onClick={onClick}><IoAdd /></button>;
}

function SonTasks({ onBack }) {
  const { list, save, remove } = useList('sonTasks');
  const [editing, setEditing] = useState(null);
  const open = list.filter((t) => !t.isDone).sort((a, b) => a.sortOrder - b.sortOrder);
  const done = list.filter((t) => t.isDone).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const row = (task) => (
    <div key={task.id} className="org-row org-task">
      <button type="button" className={`org-check ${task.isDone ? 'is-done' : ''}`} aria-label={task.title} aria-pressed={task.isDone} onClick={() => save({ ...task, isDone: !task.isDone, completedAt: task.isDone ? null : appleSeconds() })}>
        {task.isDone ? <IoCheckmarkCircle /> : <IoEllipseOutline />}
      </button>
      <button type="button" className="org-row-main" onClick={() => setEditing(task)}>
        <span className={task.isDone ? 'org-muted org-strike' : ''}>{task.title}</span>
        {task.notes && <small>{task.notes}</small>}
      </button>
    </div>
  );
  return (
    <Screen title="Tasks" onBack={onBack} backLabel="Son" trailing={<AddButton label="Add Task" onClick={() => setEditing('new')} />}>
      {list.length === 0 && <Empty icon={<IoCheckboxOutline />} title="No Tasks" text="Things to remember for your son, like buying shoes or calling the pediatrician." />}
      {open.length > 0 && <Section>{open.map(row)}</Section>}
      {done.length > 0 && <Section header={`Done (${done.length})`}>{done.map(row)}</Section>}
      {editing && (
        <ItemEditor
          title={editing === 'new' ? 'New Task' : 'Edit Task'}
          item={editing === 'new' ? null : editing}
          defaults={{ isDone: false, completedAt: null, sortOrder: firstOrder(list) }}
          fields={[{ key: 'title', label: 'Task', type: 'text' }, { key: 'notes', label: 'Notes', type: 'textarea' }]}
          onClose={() => setEditing(null)}
          onSave={(item) => { save(item); setEditing(null); }}
          onDelete={(item) => remove(item, item.title) && setEditing(null)}
        />
      )}
    </Screen>
  );
}

function DatedList({ onBack, listKey, nameKey, title, nameLabel, emptyTitle, icon }) {
  const { list, save, remove } = useList(listKey);
  const [editing, setEditing] = useState(null);
  const ordered = [...list].sort((a, b) => {
    if (a.date != null && b.date != null && a.date !== b.date) return a.date - b.date;
    if ((a.date == null) !== (b.date == null)) return a.date == null ? 1 : -1;
    return a.createdAt - b.createdAt;
  });
  return (
    <Screen title={title} onBack={onBack} backLabel="Son" trailing={<AddButton label={`Add ${nameLabel}`} onClick={() => setEditing('new')} />}>
      {list.length === 0 ? (
        <Empty icon={icon} title={emptyTitle} />
      ) : (
        <Section>
          {ordered.map((entry) => (
            <button key={entry.id} type="button" className="org-row" onClick={() => setEditing(entry)}>
              <span className="org-row-main">
                <span>{entry[nameKey]}</span>
                <small>{formatStoredDate(entry.date)}{entry.notes ? ` · ${entry.notes}` : ''}</small>
              </span>
              <span className={`org-pill org-pill-${entry.status}`}>{entry.status === 'done' ? 'Done' : 'Planned'}</span>
            </button>
          ))}
        </Section>
      )}
      {editing && (
        <ItemEditor
          title={editing === 'new' ? `New ${nameLabel}` : `Edit ${nameLabel}`}
          item={editing === 'new' ? null : editing}
          defaults={{ status: 'planned', date: null, notes: '' }}
          fields={[
            { key: nameKey, label: nameLabel, type: 'text' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'notes', label: 'Notes', type: 'textarea' },
          ]}
          onClose={() => setEditing(null)}
          onSave={(item) => { save(item); setEditing(null); }}
          onDelete={(item) => remove(item, item[nameKey]) && setEditing(null)}
        />
      )}
    </Screen>
  );
}

const fold = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function PlaceSheet({ place, onClose }) {
  return (
    <Sheet title={place.name} onClose={onClose} leading={<button type="button" className="org-link" onClick={onClose}>Close</button>}>
      <div className="org-game-hero">
        <span className="org-game-emoji" aria-hidden="true">{place.emoji}</span>
        <h2>{place.name}</h2>
        <p className="org-muted">{place.area}</p>
        <p className="org-game-meta">
          {place.travel && <span><IoCarOutline aria-hidden="true" /> {place.travel}</span>}
          {place.season && <span><IoSunnyOutline aria-hidden="true" /> {place.season}</span>}
          {place.mine && <span><IoStar aria-hidden="true" /> З вашого списку</span>}
        </p>
      </div>
      <Section><p className="org-row org-prewrap">{place.what}</p></Section>
      <Section footer="Години роботи й ціни змінюються: перевірте перед поїздкою.">
        <a className="org-row org-action org-center" href={mapsUrl(place)} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
        {place.site && <a className="org-row org-action org-center" href={place.site} target="_blank" rel="noopener noreferrer">Website</a>}
      </Section>
    </Sheet>
  );
}

function Places({ onBack }) {
  const { list, save, remove } = useList('places');
  const [query, setQuery] = useState('');
  const [openPlace, setOpenPlace] = useState(null);
  const [editing, setEditing] = useState(null);
  const mine = [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  const q = fold(query.trim());
  const matches = (place) => !q || fold(`${place.name} ${place.area} ${place.what}`).includes(q);
  return (
    <Screen title="Places" onBack={onBack} backLabel="Son" trailing={<AddButton label="Add Place" onClick={() => setEditing('new')} />}>
      <div className="org-section">
        <input className="org-search" type="search" placeholder="Search" aria-label="Search places" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {PLACE_GROUPS.map((group) => {
        const places = PLACES.filter((p) => p.group === group.id && matches(p));
        if (places.length === 0) return null;
        return (
          <Section key={group.id} header={`${group.emoji} ${group.label}`}>
            {places.map((place) => (
              <button key={place.id} type="button" className="org-row org-place-row" onClick={() => setOpenPlace(place)}>
                <span className="org-place-emoji" aria-hidden="true">{place.emoji}</span>
                <span className="org-row-main">
                  <span>{place.name}</span>
                  <small>{place.travel ? `${place.area} · ${place.travel}` : place.area}</small>
                </span>
                <IoChevronForward className="org-chevron" aria-hidden="true" />
              </button>
            ))}
          </Section>
        );
      })}
      <Section header="My places" footer={mine.length ? null : 'Tap + to add your own place.'}>
        {mine.filter((item) => !q || fold(`${item.name} ${item.notes ?? ''}`).includes(q)).map((item) => (
          <button key={item.id} type="button" className="org-row" onClick={() => setEditing(item)}>
            <span className="org-row-main"><span>{item.name}</span>{item.notes && <small>{item.notes}</small>}</span>
          </button>
        ))}
      </Section>
      {openPlace && <PlaceSheet place={openPlace} onClose={() => setOpenPlace(null)} />}
      {editing && (
        <ItemEditor
          title={editing === 'new' ? 'New Place' : 'Edit Place'}
          item={editing === 'new' ? null : editing}
          defaults={{ notes: '', sortOrder: nextOrder(list) }}
          fields={[{ key: 'name', label: 'Place', type: 'text' }, { key: 'notes', label: 'Notes', type: 'textarea' }]}
          onClose={() => setEditing(null)}
          onSave={(item) => { save(item); setEditing(null); }}
          onDelete={(item) => remove(item, item.name) && setEditing(null)}
        />
      )}
    </Screen>
  );
}

function GameSheet({ game, onClose }) {
  const category = CATEGORIES[game.category];
  return (
    <Sheet title={game.title} onClose={onClose} leading={<button type="button" className="org-link" onClick={onClose}>Close</button>}>
      <div className="org-game-hero">
        <span className="org-game-emoji" aria-hidden="true">{game.emoji}</span>
        <h2>{game.title}</h2>
        <p className="org-muted">{game.titleUk}</p>
        <p className="org-game-meta">
          {category && <span className="org-tag" style={{ background: category.color }}>{category.label}</span>}
          <span><IoHomeOutline aria-hidden="true" /> {game.place}</span>
          {game.minutes && <span><IoTimeOutline aria-hidden="true" /> ~{game.minutes} хв</span>}
        </p>
      </div>
      <Section header="Мета"><p className="org-row org-prewrap">{game.goal}</p></Section>
      <Section header="Потрібно">
        <ul className="org-row org-steps">{game.need.map((x) => <li key={x}>{x}</li>)}</ul>
      </Section>
      <Section header="Як грати">
        <ol className="org-row org-steps">{game.steps.map((x) => <li key={x}>{x}</li>)}</ol>
      </Section>
      {game.harder && <Section header="Як ускладнити"><p className="org-row org-prewrap">{game.harder}</p></Section>}
      <Section header="Розвиває"><p className="org-row org-prewrap">{game.develops}</p></Section>
      {game.note && <Section header="Важливо"><p className="org-row org-prewrap">{game.note}</p></Section>}
    </Sheet>
  );
}

function Games({ onBack }) {
  const { list, save, remove } = useList('games');
  const [openGame, setOpenGame] = useState(null);
  const [editing, setEditing] = useState(null);
  const mine = [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <Screen title="Games" onBack={onBack} backLabel="Son" trailing={<AddButton label="Add My Idea" onClick={() => setEditing('new')} />}>
      <div className="org-game-list">
        {GAMES.map((game) => {
          const category = CATEGORIES[game.category];
          return (
            <button key={game.id} type="button" className="org-game-card" onClick={() => setOpenGame(game)}>
              <span className="org-game-emoji" aria-hidden="true">{game.emoji}</span>
              <span className="org-game-text">
                <strong>{game.number}. {game.title}</strong>
                <span className="org-muted">{game.titleUk}</span>
                {category && <span className="org-tag" style={{ background: category.color }}>{category.label}</span>}
              </span>
              <IoChevronForward className="org-chevron" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <p className="org-section-footer org-tip">{GAMES_TIP}</p>
      <Section header="My ideas" footer={mine.length ? null : 'Tap + to jot down your own idea.'}>
        {mine.map((item) => (
          <button key={item.id} type="button" className="org-row" onClick={() => setEditing(item)}>
            <span className="org-row-main"><span>{item.title}</span>{item.notes && <small>{item.notes}</small>}</span>
          </button>
        ))}
      </Section>
      {openGame && <GameSheet game={openGame} onClose={() => setOpenGame(null)} />}
      {editing && (
        <ItemEditor
          title={editing === 'new' ? 'New Idea' : 'Edit Idea'}
          item={editing === 'new' ? null : editing}
          defaults={{ notes: '', sortOrder: nextOrder(list) }}
          fields={[{ key: 'title', label: 'Game', type: 'text' }, { key: 'notes', label: 'How to play', type: 'textarea' }]}
          onClose={() => setEditing(null)}
          onSave={(item) => { save(item); setEditing(null); }}
          onDelete={(item) => remove(item, item.title) && setEditing(null)}
        />
      )}
    </Screen>
  );
}

export default function SonScreen() {
  const { data } = useOrganizer();
  const [section, setSection] = useState(null);
  const back = () => setSection(null);

  if (section === 'tasks') return <SonTasks onBack={back} />;
  if (section === 'vaccinations') {
    return <DatedList onBack={back} listKey="vaccinations" nameKey="name" title="Vaccinations" nameLabel="Vaccination" emptyTitle="No Vaccinations" icon={<IoMedkitOutline />} />;
  }
  if (section === 'doctors') {
    return <DatedList onBack={back} listKey="doctorVisits" nameKey="specialist" title="Doctors" nameLabel="Visit" emptyTitle="No Doctor Visits" icon={<IoPulseOutline />} />;
  }
  if (section === 'games') return <Games onBack={back} />;
  if (section === 'places') return <Places onBack={back} />;

  const rows = [
    { id: 'tasks', label: 'Tasks', icon: IoCheckboxOutline, count: data.sonTasks.filter((t) => !t.isDone).length },
    { id: 'vaccinations', label: 'Vaccinations', icon: IoMedkitOutline, count: data.vaccinations.length },
    { id: 'doctors', label: 'Doctors', icon: IoPulseOutline, count: data.doctorVisits.length },
    { id: 'games', label: 'Games', icon: IoExtensionPuzzleOutline, count: GAMES.length + data.games.length },
    { id: 'places', label: 'Places', icon: IoLocationOutline, count: PLACES.length + data.places.length },
  ];
  return (
    <Screen title="Son">
      <Section>
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <button key={row.id} type="button" className="org-row org-nav-row" onClick={() => setSection(row.id)}>
              <Icon className="org-nav-icon" aria-hidden="true" />
              <span className="org-row-main"><span>{row.label}</span></span>
              {row.count > 0 && <span className="org-value">{row.count}</span>}
              <IoChevronForward className="org-chevron" aria-hidden="true" />
            </button>
          );
        })}
      </Section>
    </Screen>
  );
}
