import type { ComicData } from './comicSchema';

export interface ComicEntry {
  id: string;
  data: ComicData;
  body?: string;
}

/** Returns comics sorted by comicNumber; throws if two share a number. */
export function sortedComics<T extends { id: string; data: { comicNumber: number } }>(
  entries: T[],
): T[] {
  const seen = new Map<number, string>();
  for (const entry of entries) {
    const n = entry.data.comicNumber;
    const other = seen.get(n);
    if (other !== undefined) {
      throw new Error(
        `Duplicate comicNumber ${n} in comics "${other}" and "${entry.id}"`,
      );
    }
    seen.set(n, entry.id);
  }
  return [...entries].sort((a, b) => a.data.comicNumber - b.data.comicNumber);
}

export function latest<T extends { id: string; data: { comicNumber: number } }>(
  entries: T[],
): T | undefined {
  const sorted = sortedComics(entries);
  return sorted[sorted.length - 1];
}

export function byNumber<T extends { id: string; data: { comicNumber: number } }>(
  entries: T[],
  n: number,
): T | undefined {
  return sortedComics(entries).find((e) => e.data.comicNumber === n);
}

export interface NavTargets { first: number | null; prev: number | null; next: number | null; latest: number | null }
export function navTargets(numbers: number[], current: number): NavTargets {
  const s = [...numbers].sort((a, b) => a - b);
  const idx = s.indexOf(current);
  const hasPrev = idx > 0;
  const hasNext = idx >= 0 && idx < s.length - 1;
  return {
    first: hasPrev ? s[0] : null,
    prev: hasPrev ? s[idx - 1] : null,
    next: hasNext ? s[idx + 1] : null,
    latest: hasNext ? s[s.length - 1] : null,
  };
}

/** Picks a random number other than current (or current itself if it is the only one). */
export function randomExcluding(numbers: number[], current: number, rng: () => number): number {
  const others = numbers.filter((n) => n !== current);
  if (others.length === 0) return current;
  return others[Math.min(others.length - 1, Math.floor(rng() * others.length))];
}
