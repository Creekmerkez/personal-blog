import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OrganizerProvider } from '../lib/OrganizerProvider';
import { memoryStorage } from '../lib/storage';
import { emptyData } from '../lib/backup';
import { EVERY_DAY } from '../lib/weekdays';
import TodayScreen from './TodayScreen';

const TODAY = 20261120;
const ROW = 50;
const task = (id, name, sortOrder, extra = {}) => ({ id, name, details: '', flag: 'green', weekdayMask: EVERY_DAY, isActive: true, completionCount: 0, lastCompletedDayKey: null, sortOrder, createdAt: 0, ...extra });

const show = (tasks, settings = { ownTaskOrder: true }) => {
  const storage = memoryStorage({ data: { ...emptyData(), myTasks: tasks }, settings: { lastExportAt: Date.now() / 1000, ...settings } });
  render(<OrganizerProvider storage={storage} today={TODAY}><TodayScreen onOpenSettings={() => {}} /></OrganizerProvider>);
  return storage;
};
const order = async () => [...document.querySelectorAll('.org-drag-list .org-row-main > span')].map((e) => e.textContent);

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
  // Rows 50 px tall, one under another
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
    const index = this.parentElement ? [...this.parentElement.children].indexOf(this) : 0;
    return { top: 200 + index * ROW, height: ROW, bottom: 200 + (index + 1) * ROW, left: 0, right: 300, width: 300, x: 0, y: 0 };
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Ordering Today by holding and dragging', () => {
  it('numbers To Do from the top, and a task held and dragged to the bottom becomes the last (positive)', async () => {
    const storage = show([task('a', 'Yoga', 0), task('b', 'Reading', 1), task('c', 'Walk', 2)]);
    await screen.findByText('Yoga');
    expect(await order()).toEqual(['1.Yoga', '2.Reading', '3.Walk']);
    vi.useFakeTimers();
    const row = document.querySelectorAll('.org-drag-list .org-task')[0];
    fireEvent.touchStart(row, { touches: [{ clientY: 225 }] });
    act(() => vi.advanceTimersByTime(400));
    expect(row).toHaveClass('org-drag-lifted');
    fireEvent.touchMove(row, { touches: [{ clientY: 335 }] });
    fireEvent.touchEnd(row);
    vi.useRealTimers();
    await waitFor(async () => expect(await order()).toEqual(['1.Reading', '2.Walk', '3.Yoga']));
    const saved = (await storage.get('data')).myTasks;
    expect(saved.find((t) => t.id === 'a').sortOrder).toBe(2);
  });

  it('moving the finger before the hold is a scroll: nothing is lifted (negative)', async () => {
    show([task('a', 'Yoga', 0), task('b', 'Reading', 1)]);
    await screen.findByText('Yoga');
    vi.useFakeTimers();
    const row = document.querySelectorAll('.org-drag-list .org-task')[0];
    fireEvent.touchStart(row, { touches: [{ clientY: 225 }] });
    fireEvent.touchMove(row, { touches: [{ clientY: 260 }] });
    act(() => vi.advanceTimersByTime(400));
    expect(row).not.toHaveClass('org-drag-lifted');
    fireEvent.touchEnd(row);
    vi.useRealTimers();
    expect(await order()).toEqual(['1.Yoga', '2.Reading']);
  });

  it('the first time, green tasks are numbered first so nothing moves (positive)', async () => {
    const storage = show([task('r', 'Scrolling', 0, { flag: 'red' }), task('g', 'Yoga', 1)], {});
    await screen.findByText('Yoga');
    await waitFor(async () => expect(await order()).toEqual(['1.Yoga', '2.Scrolling']));
    await waitFor(async () => expect((await storage.get('settings')).ownTaskOrder).toBe(true));
  });
});
