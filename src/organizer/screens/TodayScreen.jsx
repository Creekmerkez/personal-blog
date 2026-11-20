import { useEffect, useState } from 'react';
import { IoCheckmarkDoneOutline, IoAdd, IoCheckmarkCircle, IoEllipseOutline, IoListOutline, IoDocumentTextOutline, IoSunnyOutline, IoCheckboxOutline, IoChevronUp, IoChevronDown, IoPlaySkipForwardOutline, IoArrowUndoOutline, IoStatsChartOutline } from 'react-icons/io5';
import { useOrganizer } from '../lib/context';
import { formatDay } from '../lib/dates';
import { greenFirstOrder, isDone, isSkipped, reorderSome, scheduleSummary, skipToday, todayList, toggleCompletion, unskip } from '../lib/tasks';
import { useReorder } from '../components/useReorder';
import { Empty, FlagDot, Screen, Section, Segmented } from '../components/ui';
import TaskEditor from './TaskEditor';
import BackupReminder from './BackupReminder';
import ExerciseSheet from './Exercises';
import StatsScreen from './StatsScreen';
import { removeDay } from '../lib/exercises';

const UNDO_MS = 6000;

/** A bar above the tab bar for a few seconds after a change, with a button to take it back. */
function UndoBar({ message, onUndo }) {
  return (
    <div className="org-undo" role="status">
      <span className="org-undo-text">{message}</span>
      <button type="button" className="org-undo-button" onClick={onUndo}>
        <IoArrowUndoOutline aria-hidden="true" /> Undo
      </button>
    </div>
  );
}

export default function TodayScreen({ onOpenSettings }) {
  const { data, update, settings, updateSettings, today } = useOrganizer();
  const [showAll, setShowAll] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [editing, setEditing] = useState(null); // task, 'new', or null
  const [view, setView] = useState('todo'); // 'todo' | 'done'
  const [choosing, setChoosing] = useState(null); // an exercises task being checked
  const [undo, setUndo] = useState(null); // the last change on a task, for a few seconds: { message, task, log? }

  // Today's order is the owner's own now; it used to put green tasks first. Number them
  // that way once, so the list looks the same until she moves something.
  useEffect(() => {
    if (settings.ownTaskOrder) return;
    updateSettings({ ownTaskOrder: true });
    update((d) => ({ ...d, myTasks: greenFirstOrder(d.myTasks) }));
  }, [settings.ownTaskOrder, updateSettings, update]);

  useEffect(() => {
    if (!undo) return undefined;
    const timer = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  const tasks = data.myTasks;
  const visible = todayList(tasks, today);
  const todo = visible.filter((task) => !isDone(task, today) && !isSkipped(task, today));
  const done = visible.filter((task) => isDone(task, today));
  const skipped = visible.filter((task) => isSkipped(task, today));
  // New tasks go to the top of the list.
  const firstSortOrder = tasks.reduce((min, t) => Math.min(min, t.sortOrder), 0) - 1;

  const replaceTask = (task) =>
    update((d) => ({ ...d, myTasks: d.myTasks.some((t) => t.id === task.id) ? d.myTasks.map((t) => (t.id === task.id ? task : t)) : [...d.myTasks, task] }));

  // Keeps the task as it was (and the exercise history, when it changes too), so the change can be undone.
  const remember = (task, message, withLog = false) => setUndo({ message, task, ...(withLog ? { log: data.exerciseLog } : {}) });
  const undoLast = () => {
    const { task, log } = undo;
    setUndo(null);
    update((d) => ({ ...d, myTasks: d.myTasks.map((t) => (t.id === task.id ? task : t)), ...(log ? { exerciseLog: log } : {}) }));
  };

  const toggle = (task, withLog = false) => {
    remember(task, `${isDone(task, today) ? 'Not done' : 'Done'}: ${task.name}`, withLog);
    replaceTask(toggleCompletion(task, today));
  };
  // An exercises task asks "run or workout?" when checked; unchecking takes the day out of the history.
  const check = (task) => {
    if (!task.exercises) return toggle(task);
    if (!isDone(task, today)) return setChoosing(task);
    update((d) => ({ ...d, exerciseLog: removeDay(d.exerciseLog, today) }));
    return toggle(task, true);
  };
  // Hold a task on To Do and drag it: its new place is its priority for the day, and stays.
  const { listProps, itemProps, placeOf } = useReorder((from, to) => {
    const ids = todo.map((t) => t.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    update((d) => ({ ...d, myTasks: reorderSome(d.myTasks, ids) }));
  });

  const skip = (task) => {
    remember(task, `Skipped today: ${task.name}`);
    replaceTask(skipToday(task, today));
  };
  const restore = (task) => {
    remember(task, `Back on To Do: ${task.name}`);
    replaceTask(unskip(task));
  };

  // index: the task's place on To Do, numbered and draggable there.
  const row = (task, index = null) => {
    const checked = isDone(task, today);
    const wasSkipped = isSkipped(task, today);
    const drag = index == null ? {} : itemProps(index);
    return (
      <div key={task.id} {...drag} className={`org-row org-task ${drag.className ?? ''}`}>
        <FlagDot flag={task.flag} />
        <button
          type="button"
          className={`org-check ${checked ? 'is-done' : ''}`}
          aria-label={task.name}
          aria-pressed={checked}
          onClick={() => check(task)}
        >
          {checked ? <IoCheckmarkCircle /> : <IoEllipseOutline />}
        </button>
        {/* An exercises task opens its run-or-workout sheet; its settings are in that sheet and in All Tasks. */}
        <button type="button" className="org-row-main" onClick={() => (task.exercises ? setChoosing(task) : setEditing(task))}>
          <span className={checked || wasSkipped ? 'org-muted' : ''}>
            {index != null && <span className="org-task-number">{placeOf(index) + 1}.</span>}
            {task.name}
          </span>
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

  const openStats = () => {
    setShowStats(true);
    window.scrollTo(0, 0);
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
      offerExercises={editing !== 'new' && !tasks.some((t) => t.exercises === true)}
      onClose={() => setEditing(null)}
      onDelete={remove}
      onSave={(task) => {
        const before = tasks.find((t) => t.id === task.id);
        if (before) remember(before, `Saved: ${task.name}`);
        replaceTask(task);
        setEditing(null);
      }}
    />
  );

  const chooser = choosing && (
    <ExerciseSheet
      onClose={() => setChoosing(null)}
      onEditTask={() => {
        setEditing(choosing);
        setChoosing(null);
      }}
      onOpenStats={() => {
        setChoosing(null);
        openStats();
      }}
      onDone={() => {
        // The sheet has just written today's run or workout; data here is still from before it.
        if (!isDone(choosing, today)) toggle(choosing, true);
        setChoosing(null);
      }}
    />
  );

  if (showStats) return <StatsScreen onBack={() => setShowStats(false)} />;

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
        {undo && <UndoBar message={undo.message} onUndo={undoLast} />}
      </Screen>
    );
  }

  return (
    <Screen
      title="Today"
      leading={
        <>
          <button type="button" className="org-icon-button" aria-label="All Tasks" onClick={() => setShowAll(true)}>
            <IoListOutline />
          </button>
          <button type="button" className="org-icon-button" aria-label="Statistics" onClick={openStats}>
            <IoStatsChartOutline />
          </button>
        </>
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
              <Section header={formatDay(today)} footer="Hold a task and drag it up or down to set today’s order. Circle: done, counts one more day. Skip: not today, no count.">
                <div className="org-drag-list" {...listProps}>{todo.map((task, i) => row(task, i))}</div>
              </Section>
            )
          ) : done.length + skipped.length === 0 ? (
            <Empty icon={<IoEllipseOutline />} title="Nothing Checked Yet" text="Tasks you check or skip today move here." />
          ) : (
            <>
              {done.length > 0 && <Section header="Done">{done.map((task) => row(task))}</Section>}
              {skipped.length > 0 && (
                <Section header="Skipped" footer="Not counted. Tap the circle if you did it after all, or the arrow to put it back on To Do.">{skipped.map((task) => row(task))}</Section>
              )}
            </>
          )}
        </>
      )}

      {editor}
      {chooser}
      {undo && <UndoBar message={undo.message} onUndo={undoLast} />}
    </Screen>
  );
}
