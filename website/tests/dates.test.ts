import { expect, it } from 'vitest';
import { formatPublishDate } from '../src/lib/dates';

it('formats publication dates in English using UTC regardless of local timezone', () => {
  expect(formatPublishDate(new Date('2026-10-22'))).toBe('October 22, 2026');
  expect(formatPublishDate(new Date('2026-01-01T00:00:00Z'))).toBe('January 1, 2026');
});
