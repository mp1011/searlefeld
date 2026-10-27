import { renameSync, writeFileSync } from 'node:fs';

/** Writes via a temp file + rename so an interrupted run never leaves half-written JSON. */
export function writeFileAtomic(path: string, content: string): void {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, path);
}
