import { describe, it, expect } from 'vitest';
import { fitWithin } from './photos';

describe('photo size', () => {
  it('scales the longer side down to the limit, keeping the shape', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 });
  });

  it('never scales a small photo up (negative)', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
