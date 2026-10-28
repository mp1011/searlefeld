import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeFileAtomic } from './fsutil';

export const LAST_STAGE = 7;

export interface Status {
  /** The stage the comic is up to (1-7), or LAST_STAGE + 1 when finished. */
  stage: number;
  completed: number[];
  /** Per-panel progress for the review stages: stage number -> accepted 0-based panel indexes. */
  accepted?: Record<string, number[]>;
}

export function statusPath(comicDir: string): string {
  return join(comicDir, 'status.json');
}

export function readStatus(comicDir: string): Status {
  const path = statusPath(comicDir);
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new Error(`Cannot read ${path}: ${(e as Error).message}`);
  }
  const s = parsed as Partial<Status>;
  if (!Number.isInteger(s?.stage) || !Array.isArray(s?.completed)) {
    throw new Error(`${path} must contain an integer "stage" and a "completed" array.`);
  }
  const status: Status = { stage: s.stage as number, completed: s.completed as number[] };
  if (s.accepted) status.accepted = s.accepted;
  return status;
}

export function writeStatus(comicDir: string, status: Status): void {
  writeFileAtomic(statusPath(comicDir), JSON.stringify(status, null, 2) + '\n');
}
