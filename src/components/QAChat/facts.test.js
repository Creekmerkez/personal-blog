import { describe, it, expect } from 'vitest';
import { montikAgeAtLeast, uaYears, yearsInPrague } from './facts';

describe('facts counted from the year', () => {
  it('counts years in Prague and Montik\'s age, and keeps counting (positive)', () => {
    expect(yearsInPrague(new Date(2026, 9, 25))).toBe(10);
    expect(yearsInPrague(new Date(2031, 0, 1))).toBe(15);
    // Born some time in 2014: in late 2026 he is at least 11, whatever the month.
    expect(montikAgeAtLeast(new Date(2026, 9, 25))).toBe(11);
    expect(montikAgeAtLeast(new Date(2027, 0, 1))).toBe(12);
  });

  it('uses the right Ukrainian word for years, teens included (positive and edge cases)', () => {
    expect([1, 2, 5, 10, 11, 12, 14, 21, 22, 25].map(uaYears)).toEqual([
      '1 рік', '2 роки', '5 років', '10 років', '11 років', '12 років', '14 років', '21 рік', '22 роки', '25 років',
    ]);
  });
});
