import { describe, expect, it } from 'vitest';
import { navTargets, randomExcluding } from '../src/lib/comics';

const nums = [1, 2, 3];

describe('navTargets', () => {
  it('first comic has no prev/first', () => {
    expect(navTargets(nums, 1)).toEqual({ first: null, prev: null, next: 2, latest: 3 });
  });
  it('latest comic has no next/latest', () => {
    expect(navTargets(nums, 3)).toEqual({ first: 1, prev: 2, next: null, latest: null });
  });
  it('middle comic has all four', () => {
    expect(navTargets(nums, 2)).toEqual({ first: 1, prev: 1, next: 3, latest: 3 });
  });
});

describe('randomExcluding', () => {
  it('never returns current over many draws', () => {
    for (let i = 0; i < 300; i++) {
      expect(randomExcluding(nums, 2, Math.random)).not.toBe(2);
    }
  });
  it('covers every other value across rng range', () => {
    const seen = new Set([0, 0.49, 0.5, 0.99].map((r) => randomExcluding(nums, 2, () => r)));
    expect(seen).toEqual(new Set([1, 3]));
  });
  it('returns the only comic when there is one', () => {
    expect(randomExcluding([7], 7, Math.random)).toBe(7);
  });
});
