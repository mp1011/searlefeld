import { describe, expect, it } from 'vitest';
import { byNumber, latest, sortedComics } from '../src/lib/comics';
import { comicSchema } from '../src/lib/comicSchema';

const e = (id: string, n: number) => ({ id, data: { comicNumber: n } });

describe('comic helpers', () => {
  it('sorts by comicNumber and latest returns highest', () => {
    const list = [e('b', 2), e('c', 3), e('a', 1)];
    expect(sortedComics(list).map((x) => x.data.comicNumber)).toEqual([1, 2, 3]);
    expect(latest(list)?.id).toBe('c');
    expect(byNumber(list, 2)?.id).toBe('b');
  });

  it('throws naming a duplicate comicNumber', () => {
    expect(() => sortedComics([e('a', 1), e('b', 2), e('c', 2)])).toThrow(/Duplicate comicNumber 2/);
  });
});

describe('comicSchema', () => {
  const full = {
    comicNumber: 1,
    title: 'T',
    publishDate: new Date('2026-01-01'),
    image: '/comics/x.png',
    altText: 'alt',
  };
  it('accepts a complete entry', () => {
    expect(comicSchema.safeParse(full).success).toBe(true);
  });
  it('rejects an entry missing altText', () => {
    const { altText, ...rest } = full;
    expect(comicSchema.safeParse(rest).success).toBe(false);
  });
});
