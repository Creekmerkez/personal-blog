import { describe, it, expect } from 'vitest';
import { EXAM_TOPICS } from './examTopics';
import { sentences } from '../lib/exam';

describe('exam topics', () => {
  it('has the 20 topics, numbered 1–20, each 10–15 sentences (positive)', () => {
    expect(EXAM_TOPICS.map((t) => t.number)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    for (const topic of EXAM_TOPICS) {
      expect(topic.title, topic.id).toBeTruthy();
      const lines = sentences(topic);
      expect(lines.length, topic.title).toBeGreaterThanOrEqual(10);
      expect(lines.length, topic.title).toBeLessThanOrEqual(15);
      for (const line of lines) expect(line, topic.title).toMatch(/[.!?]$/);
    }
  });

  it('ids are unique and no line is left empty (negative)', () => {
    expect(new Set(EXAM_TOPICS.map((t) => t.id)).size).toBe(EXAM_TOPICS.length);
    for (const topic of EXAM_TOPICS) expect(topic.text.split('\n').filter((l) => !l.trim())).toEqual([]);
  });
});
