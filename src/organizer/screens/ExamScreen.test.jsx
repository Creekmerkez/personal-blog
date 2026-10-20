import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizerProvider } from '../lib/OrganizerProvider';
import { memoryStorage } from '../lib/storage';
import { emptyData, validateBackup } from '../lib/backup';
import { togglePractised, topicForToday } from '../lib/exam';
import ExamScreen from './ExamScreen';

const TODAY = 20261020;

const show = (storage = memoryStorage()) => {
  render(<OrganizerProvider storage={storage} today={TODAY}><ExamScreen /></OrganizerProvider>);
  return storage;
};

beforeEach(() => vi.spyOn(window, 'scrollTo').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe('Zkouška', () => {
  it('puts in the 20 topics on the first visit and suggests №1 for today (positive)', async () => {
    show();
    const today = await screen.findByRole('heading', { name: 'Today' });
    expect(today).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Not practised yet/ })).toHaveLength(21); // today's card + 20 rows
    expect(screen.getByText('0 of 20 practised today')).toBeInTheDocument();
  });

  it('does not put them back once the list was emptied (negative)', async () => {
    show(memoryStorage({ data: emptyData(), settings: { examSeeded: true } }));
    expect(await screen.findByText('No Topics')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add the 20 Topics' }));
    expect(screen.getByText('0 of 20 practised today')).toBeInTheDocument();
  });

  it('practise hides each sentence behind its first word until tapped, and marks the day (positive)', async () => {
    show();
    await userEvent.click((await screen.findAllByRole('button', { name: /Moje rodina/ }))[0]);
    expect(screen.getByText('Mám manžela a syna.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Practise' }));
    expect(screen.queryByText('Mám manžela a syna.')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Show sentence 2' }));
    expect(screen.getByText('Mám manžela a syna.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Mark as Practised Today' }));
    expect(screen.getByRole('button', { name: 'Practised Today' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Zkouška/ }));
    expect(screen.getByText('1 of 20 practised today')).toBeInTheDocument();
    // №2 is next now
    expect(within(screen.getByRole('heading', { name: 'Today' }).parentElement).getByText('Bydlení')).toBeInTheDocument();
  });

  it('edits a topic and keeps one sentence per line (positive)', async () => {
    show();
    await userEvent.click((await screen.findAllByRole('button', { name: /Sport/ }))[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const text = screen.getByRole('textbox', { name: 'Text' });
    await userEvent.clear(text);
    await userEvent.type(text, 'Rád běhám.{Enter}{Enter}  Plavu v létě.  ');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Rád běhám.', 'Plavu v létě.']);
  });

  it('cannot save a topic without a title or text (negative)', async () => {
    show();
    await screen.findByRole('heading', { name: 'Today' });
    await userEvent.click(screen.getByRole('button', { name: 'Add Topic' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox', { name: 'Topic' }), 'Moje město');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});

describe('exam topic logic and files', () => {
  const topic = (number, practisedOn = []) => ({ id: `t${number}`, number, title: `T${number}`, text: 'A.', practisedOn });

  it('suggests the longest unpractised topic, never-practised first (positive)', () => {
    const topics = [topic(1, [20261019]), topic(2, [20261010]), topic(3)];
    expect(topicForToday(topics, TODAY).number).toBe(3);
    expect(topicForToday(topics.slice(0, 2), TODAY).number).toBe(2);
    expect(topicForToday([topic(1, [TODAY])], TODAY)).toBeNull();
    expect(togglePractised(togglePractised(topic(1), TODAY), TODAY).practisedOn).toEqual([]);
  });

  it('backups carry the topics, and a damaged topic is refused (negative)', () => {
    expect(validateBackup({ formatVersion: 1, examTopics: [topic(1)] }).examTopics).toHaveLength(1);
    expect(validateBackup({ formatVersion: 1 }).examTopics).toEqual([]);
    expect(() => validateBackup({ formatVersion: 1, examTopics: [{ title: 'x' }] })).toThrow('damaged');
  });
});
