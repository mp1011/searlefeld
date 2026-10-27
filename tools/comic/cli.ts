import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCodex } from './codex';
import { dispatch } from './dispatch';
import { chooseOption, createAsk } from './menu';
import { COMIC_SRC_DIR, scaffoldComic } from './scaffold';
import { stageHandlers } from './stages';

const repoRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));

function listComics(): string[] {
  const dir = join(repoRoot, COMIC_SRC_DIR);
  return existsSync(dir) ? readdirSync(dir).filter((n) => /^\d{3}_/.test(n)).sort() : [];
}

async function main(args: string[]): Promise<void> {
  if (args[0] === 'new') {
    if (!args[1]) throw new Error('Usage: npm run comic -- new <path to situations/*.md>');
    console.log(scaffoldComic(repoRoot, args[1]));
    return;
  }
  const { ask, close } = createAsk();
  try {
    let comicDir = args[0] ? resolve(args[0]) : undefined;
    if (!comicDir) {
      const comics = listComics();
      if (comics.length === 0) {
        throw new Error(`No comics in ${COMIC_SRC_DIR}/. Create one with: npm run comic -- new <situation.md>`);
      }
      comicDir = join(repoRoot, COMIC_SRC_DIR, comics[await chooseOption(ask, 'Pick a comic:', comics)]);
    }
    await dispatch(comicDir, { handlers: stageHandlers, codex: createCodex(), ask, log: console.log });
  } finally {
    close();
  }
}

main(process.argv.slice(2)).catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
