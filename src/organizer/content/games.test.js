import { describe, it, expect } from 'vitest';
import { CATEGORIES, GAMES, QUICK_IDEAS } from './games';

describe('built-in game ideas', () => {
  it('every game is complete: id, number, emoji, titles, category, goal, needs, steps, develops', () => {
    for (const game of GAMES) {
      expect(game.id, JSON.stringify(game)).toMatch(/^[a-z0-9-]+$/);
      expect(Number.isInteger(game.number)).toBe(true);
      expect(game.emoji).toBeTruthy();
      expect(game.title).toBeTruthy();
      expect(game.titleUk).toBeTruthy();
      expect(CATEGORIES[game.category], game.id).toBeTruthy();
      expect(game.goal).toBeTruthy();
      expect(game.need.length).toBeGreaterThan(0);
      expect(game.steps.length).toBeGreaterThanOrEqual(3);
      expect(game.develops).toBeTruthy();
    }
  });

  it('ids and numbers are unique (negative)', () => {
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(GAMES.length);
    expect(new Set(GAMES.map((g) => g.number)).size).toBe(GAMES.length);
  });

  it('every quick idea has an emoji and one line of text, none twice (positive)', () => {
    expect(QUICK_IDEAS.length).toBeGreaterThan(0);
    for (const idea of QUICK_IDEAS) {
      expect(idea.emoji).toBeTruthy();
      expect(idea.text.trim()).toBeTruthy();
      expect(idea.text).not.toContain('\n');
    }
    expect(new Set(QUICK_IDEAS.map((i) => i.text)).size).toBe(QUICK_IDEAS.length);
  });
});
