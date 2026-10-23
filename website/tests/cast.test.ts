import { describe, expect, it } from 'vitest';
import { appearances, cast } from '../src/lib/cast';
import { comicSchema } from '../src/lib/comicSchema';

describe('cast', () => {
  it('finds appearances from comic character tags without changing their order', () => {
    const comics = [
      { id: 'first', data: { characters: ['roko' as const, 'max' as const] } },
      { id: 'second', data: { characters: ['max' as const] } },
    ];
    expect(appearances(comics, 'max')).toEqual(comics);
    expect(appearances(comics, 'roko')).toEqual([comics[0]]);
    expect(appearances(comics, 'ailan')).toEqual([]);
    expect(appearances([], 'max')).toEqual([]);
  });

  it('defines all four main characters using valid schema keys', () => {
    expect(Object.keys(cast)).toEqual(['roko', 'max', 'ailan', 'chinese_room']);
    for (const key of Object.keys(cast)) {
      expect(comicSchema.shape.characters.parse([key])).toEqual([key]);
    }
  });
});
