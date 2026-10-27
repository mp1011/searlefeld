import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, relative, resolve, sep } from 'node:path';
import { writeFileAtomic } from './fsutil';
import { panelsTemplate } from './panels';
import { writeStatus } from './status';

export const SITUATIONS_DIR = join('agent_docs', 'comic_notes', 'situations');
export const COMIC_SRC_DIR = 'comic_src';

const toPosix = (p: string) => p.split(sep).join('/');

/** Throws a readable Error unless the file exists and lives under the situations folder. */
export function resolveSituationFile(repoRoot: string, sourcePath: string): string {
  const abs = resolve(sourcePath);
  const situations = resolve(repoRoot, SITUATIONS_DIR);
  if (!existsSync(abs) || !statSync(abs).isFile()) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }
  const rel = relative(situations, abs);
  if (rel.startsWith('..') || resolve(situations, rel) !== abs || extname(abs) !== '.md') {
    throw new Error(`Source must be a .md file inside ${toPosix(SITUATIONS_DIR)}: ${sourcePath}`);
  }
  return abs;
}

export function nextComicNumber(comicSrc: string): number {
  if (!existsSync(comicSrc)) return 0;
  const numbers = readdirSync(comicSrc)
    .map((name) => /^(\d{3})_/.exec(name))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]));
  return numbers.length === 0 ? 0 : Math.max(...numbers) + 1;
}

/** Stage 1: creates comic_src/NNN_<name>/ with status.json and a template panels.json. */
export function scaffoldComic(repoRoot: string, sourcePath: string): string {
  const source = resolveSituationFile(repoRoot, sourcePath);
  const comicSrc = join(repoRoot, COMIC_SRC_DIR);
  const number = String(nextComicNumber(comicSrc)).padStart(3, '0');
  const comicDir = join(comicSrc, `${number}_${basename(source, '.md')}`);
  mkdirSync(comicDir, { recursive: true });
  const template = panelsTemplate(toPosix(relative(repoRoot, source)));
  writeFileAtomic(join(comicDir, 'panels.json'), JSON.stringify(template, null, 2) + '\n');
  writeStatus(comicDir, { stage: 2, completed: [1] });
  return comicDir;
}
