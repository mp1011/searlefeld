import { expect, it } from 'vitest';
import { buildMeta } from '../src/lib/meta';

const comic = { id: 'test', data: { comicNumber: 1, title: 'Test strip', image: '/comics/test.png', altText: 'Strip description', publishDate: new Date('2026-01-01'), characters: [] }, body: '\nFirst transcript line\n\nSecond line' };

it('builds absolute comic metadata from the configured site', () => {
  expect(buildMeta(comic, 'https://example.com')).toMatchObject({
    title: 'Test strip', description: 'Strip description', image: 'https://example.com/comics/test.png',
  });
});

it('uses the first transcript line when alt text is empty', () => {
  expect(buildMeta({ ...comic, data: { ...comic.data, altText: '' } }, 'https://example.com').description).toBe('First transcript line');
});

it('returns site defaults without a comic', () => {
  expect(buildMeta(null, 'https://example.com')).toEqual({
    title: 'Searlefeld', description: 'Four AI thought experiments sharing an apartment.',
    image: 'https://example.com/cast/cast-portrait-v1.png',
  });
});
