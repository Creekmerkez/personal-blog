import { useState } from 'react';
import { IoCheckmarkDoneOutline, IoAdd, IoCheckmarkCircle, IoEllipseOutline, IoListOutline, IoDocumentTextOutline, IoSunnyOutline, IoCheckboxOutline, IoChevronUp, IoChevronDown, IoPlaySkipForwardOutline, IoArrowUndoOutline } from 'react-icons/io5';
import { useOrganizer } from '../lib/context';
import { formatDay } from '../lib/dates';
import { isDone, isSkipped, scheduleSummary, skipToday, todayList, toggleCompletion, unskip } from '../lib/tasks';
import { Empty, FlagDot, Screen, Section, Segmented } from '../components/ui';
import TaskEditor from './TaskEditor';
import BackupReminder from './BackupReminder';

export default function TodayScreen({ onOpenSettings }) {
  const { data, update, today } = useOrganizer();
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(null); // task, 'new', or null
  const [view, setView] = useState('todo'); // 'todo' | 'done'

  const tasks = data.myTasks;
  const visible = todayList(tasks, today);
  const todo = visible.filter((task) => !isDone(task, today) && !isSkipped(task, today));
  const done = visible.filter((task) => isDone(task, today));
  const skipped = visible.filter((task) => isSkipped(task, today));
  // New tasks go to the top of the list.
  const firstSortOrder = tasks.reduce((min, t) => Math.min(min, t.sortOrder), 0) - 1;

  const replaceTask = (task) =>
    update((d) => ({ ...d, myTasks: d.myTasks.some((t) => t.id === task.id) ? d.myTasks.map((t) => (t.id === task.id ? task : t)) : [...d.myTasks, task] }));

  const toggle = (task) => replaceTask(toggleCompletion(task, today));
  const skip = (task) => replaceTask(skipToday(task, today));
  const restore = (task) => replaceTask(unskip(task));

  const row = (task) => {
    const checked = isDone(task, today);
    const wasSkipped = isSkipped(task, today);
    return (
      <div key={task.id} className="org-row org-task">
        <FlagDot flag={task.flag} />
        <button
          type="button"
          className={`org-check ${checked ? 'is-done' : ''}`}
          aria-label={task.name}
          aria-pressed={checked}
          onClick={() => toggle(task)}
        >
          {checked ? <IoCheckmarkCircle /> : <IoEllipseOutline />}
        </button>
        <button type="button" className="org-row-main" onClick={() => setEditing(task)}>
          <span className={checked || wasSkipped ? 'org-muted' : ''}>{task.name}</span>
        </button>
        {task.details && <IoDocumentTextOutline className="org-details-mark" aria-hidden="true" />}
        <span className="org-count" aria-label={`${task.completionCount} days`}>{task.completionCount}</span>
        {!checked && (
          wasSkipped ? (
            <button type="button" className="org-skip" aria-label={`Back to To Do: ${task.name}`} onClick={() => restore(task)}>
              <IoArrowUndoOutline />
            </button>
          ) : (
            <button type="button" className="org-skip" aria-label={`Skip today: ${task.name}`} onClick={() => skip(task)}>
              <IoPlaySkipForwardOutline />
            </button>
          )
        )}
      </div>
    );
  };

  const remove = (task) => {
    if (!window.confirm(`Delete “${task.name}” and its counter (${task.completionCount})?`)) return;
    update((d) => ({ ...d, myTasks: d.myTasks.filter((t) => t.id !== task.id) }));
    setEditing(null);
  };

  const move = (task, offset) => {
    const ordered = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((t) => t.id === task.id);
    const target = index + offset;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const order = new Map(ordered.map((t, i) => [t.id, i]));
    update((d) => ({ ...d, myTasks: d.myTasks.map((t) => ({ ...t, sortOrder: order.get(t.id) })) }));
  };

  const addButton = (
    <button type="button" className="org-icon-button" aria-label="Add Task" onClick={() => setEditing('new')}>
      <IoAdd />
    </button>
  );

  const editor = editing && (
    <TaskEditor
      key={`editor-${editing === 'new' ? 'new' : editing.id}`}
      task={editing === 'new' ? null : editing}
      sortOrder={firstSortOrder}
      onClose={() => setEditing(null)}
      onDelete={remove}
      onSave={(task) => {
        replaceTask(task);
        setEditing(null);
      }}
    />
  );

  if (showAll) {
    const ordered = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
    return (
      <Screen title="All Tasks" onBack={() => setShowAll(false)} backLabel="Today" trailing={addButton}>
        {ordered.length === 0 ? (
          <Empty icon={<IoCheckboxOutline />} title="No Tasks Yet" />
        ) : (
          <Section footer="Tap a task to edit it, change its days, pause it or delete it.">
            {ordered.map((task, index) => (
              <div key={task.id} className="org-row org-task-manage">
                <FlagDot flag={task.flag} />
                <button type="button" className="org-row-main" onClick={() => setEditing(task)}>
                  <span className={task.isActive ? '' : 'org-muted'}>{task.name}</span>
                  <small>{scheduleSummary(task, today)}{task.isActive ? '' : ' · Paused'}</small>
                </button>
                <span className="org-count">{task.completionCount}</span>
                <span className="org-reorder">
                  <button type="button" aria-label={`Move ${task.name} up`} disabled={index === 0} onClick={() => move(task, -1)}><IoChevronUp /></button>
                  <button type="button" aria-label={`Move ${task.name} down`} disabled={index === ordered.length - 1} onClick={() => move(task, 1)}><IoChevronDown /></button>
                </span>
              </div>
            ))}
          </Section>
        )}
        {editor}
      </Screen>
    );
  }

  return (
    <Screen
      title="Today"
      leading={
        <button type="button" className="org-icon-button" aria-label="All Tasks" onClick={() => setShowAll(true)}>
          <IoListOutline />
        </button>
      }
      trailing={addButton}
    >
      <BackupReminder onOpenSettings={onOpenSettings} />
      {tasks.length === 0 ? (
        <Empty
          icon={<IoCheckboxOutline />}
          title="No Tasks Yet"
          text="Add the things you want to do every day or on certain days, or import your file in Settings."
          action={<button type="button" className="org-button" onClick={() => setEditing('new')}>Add Task</button>}
        />
      ) : visible.length === 0 ? (
        <Empty icon={<IoSunnyOutline />} title="Nothing for Today" text="No tasks are scheduled for today." />
      ) : (
        <>
          <div className="org-section">
            <Segmented
              label="Show"
              value={view}
              onChange={setView}
              options={[{ value: 'todo', label: `To Do (${todo.length})` }, { value: 'done', label: `Done (${done.length + skipped.length})` }]}
            />
          </div>
          {view === 'todo' ? (
            todo.length === 0 ? (
              <Empty icon={<IoCheckmarkDoneOutline />} title="Everything Done" text="All of today's tasks are checked or skipped. Tomorrow the list starts again." />
            ) : (
              <Section header={formatDay(today)} footer="Circle: done, counts one more day. Skip: not today, no count.">{todo.map(row)}</Section>
            )
          ) : done.length + skipped.length === 0 ? (
            <Empty icon={<IoEllipseOutline />} title="Nothing Checked Yet" text="Tasks you check or skip today move here." />
          ) : (
            <>
              {done.length > 0 && <Section header="Done">{done.map(row)}</Section>}
              {skipped.length > 0 && (
                <Section header="Skipped" footer="Not counted. Tap the circle if you did it after all, or the arrow to put it back on To Do.">{skipped.map(row)}</Section>
              )}
            </>
          )}
        </>
      )}

      {editor}
    </Screen>
  );
}
