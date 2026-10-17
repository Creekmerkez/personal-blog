import { useState } from 'react';
import { IoAdd, IoCheckmarkCircle, IoEllipseOutline, IoListOutline, IoDocumentTextOutline, IoSunnyOutline, IoCheckboxOutline, IoChevronUp, IoChevronDown } from 'react-icons/io5';
import { useOrganizer } from '../lib/context';
import { formatDay } from '../lib/dates';
import { isDone, todayList, toggleCompletion } from '../lib/tasks';
import { summary } from '../lib/weekdays';
import { Empty, FlagDot, Screen, Section, Sheet } from '../components/ui';
import TaskEditor from './TaskEditor';
import BackupReminder from './BackupReminder';

export default function TodayScreen({ onOpenSettings }) {
  const { data, update, today } = useOrganizer();
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(null); // task, 'new', or null
  const [openTask, setOpenTask] = useState(null);

  const tasks = data.myTasks;
  const visible = todayList(tasks, today);
  const nextSortOrder = tasks.reduce((max, t) => Math.max(max, t.sortOrder), -1) + 1;

  const replaceTask = (task) =>
    update((d) => ({ ...d, myTasks: d.myTasks.some((t) => t.id === task.id) ? d.myTasks.map((t) => (t.id === task.id ? task : t)) : [...d.myTasks, task] }));

  const toggle = (task) => replaceTask(toggleCompletion(task, today));

  const remove = (task) => {
    if (!window.confirm(`Delete “${task.name}” and its counter (${task.completionCount})?`)) return;
    update((d) => ({ ...d, myTasks: d.myTasks.filter((t) => t.id !== task.id) }));
    setEditing(null);
    setOpenTask(null);
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
      task={editing === 'new' ? null : editing}
      nextSortOrder={nextSortOrder}
      onClose={() => setEditing(null)}
      onDelete={remove}
      onSave={(task) => {
        replaceTask(task);
        setEditing(null);
        if (openTask?.id === task.id) setOpenTask(task);
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
                  <small>{summary(task.weekdayMask)}{task.isActive ? '' : ' · Paused'}</small>
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
        <Section header={formatDay(today)}>
          {visible.map((task) => {
            const done = isDone(task, today);
            return (
              <div key={task.id} className="org-row org-task">
                <FlagDot flag={task.flag} />
                <button
                  type="button"
                  className={`org-check ${done ? 'is-done' : ''}`}
                  aria-label={task.name}
                  aria-pressed={done}
                  onClick={() => toggle(task)}
                >
                  {done ? <IoCheckmarkCircle /> : <IoEllipseOutline />}
                </button>
                <button type="button" className="org-row-main" onClick={() => setOpenTask(task)}>
                  <span>{task.name}</span>
                </button>
                {task.details && <IoDocumentTextOutline className="org-details-mark" aria-hidden="true" />}
                <span className="org-count" aria-label={`${task.completionCount} days`}>{task.completionCount}</span>
              </div>
            );
          })}
        </Section>
      )}

      {openTask && !editing && (
        <Sheet
          title={openTask.name}
          onClose={() => setOpenTask(null)}
          leading={<button type="button" className="org-link" onClick={() => setOpenTask(null)}>Close</button>}
          trailing={<button type="button" className="org-link" onClick={() => setEditing(openTask)}>Edit</button>}
        >
          <Section>
            <div className="org-row org-labeled"><span>Type</span><span className="org-value"><FlagDot flag={openTask.flag} /> {openTask.flag === 'red' ? 'Red' : 'Green'}</span></div>
            <div className="org-row org-labeled"><span>Repeats</span><span className="org-value">{summary(openTask.weekdayMask)}</span></div>
            <div className="org-row org-labeled"><span>Days checked</span><span className="org-value">{openTask.completionCount}</span></div>
            {!openTask.isActive && <div className="org-row org-labeled"><span>Status</span><span className="org-value">Paused</span></div>}
          </Section>
          <Section header="Details">
            <p className="org-row org-prewrap">{openTask.details || <span className="org-muted">No details</span>}</p>
          </Section>
          <Section>
            <button type="button" className="org-row org-destructive" onClick={() => remove(openTask)}>Delete Task</button>
          </Section>
        </Sheet>
      )}
      {editor}
    </Screen>
  );
}
