import type { Loader } from 'astro/loaders';
import { existsSync, readdirSync, readFileSync, statSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import type { ComicData } from './comicSchema';
import { cast } from './cast';

export interface RawPanelCharacter {
  character: string;
  action?: string;
  mood?: string;
  dialogue?: string;
}

export interface RawPanel {
  width?: number;
  height?: number;
  row?: number;
  column?: number;
  background?: {
    reference?: string;
    description?: string;
    mode?: string;
  };
  characters?: RawPanelCharacter[];
}

export interface RawPanelsJson {
  source?: string;
  title: string;
  publishDate?: string;
  date?: string;
  altText?: string;
  alt_text?: string;
  hoverText?: string;
  panels?: RawPanel[];
}

export interface ComicSrcRecord {
  dirName: string;
  id: string;
  comicNumber: number;
  data: ComicData;
  transcript: string;
  fullImagePath: string;
}

function formatSpeakerName(characterKey: string): string {
  if (characterKey in cast) {
    return cast[characterKey as keyof typeof cast].name;
  }
  return characterKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildTranscript(panels: RawPanel[] = []): string {
  const lines: string[] = [];
  for (const panel of panels) {
    for (const character of panel.characters ?? []) {
      const dialogue = character.dialogue?.trim();
      if (dialogue) {
        lines.push(`${formatSpeakerName(character.character)}: ${dialogue}`);
      }
    }
  }
  return lines.join('\n\n');
}

const VALID_CHARACTERS = new Set<ComicData['characters'][number]>([
  'roko',
  'max',
  'ailan',
  'chinese_room',
  'other',
]);

export function extractCharacters(panels: RawPanel[] = []): ComicData['characters'] {
  const seen = new Set<ComicData['characters'][number]>();
  const result: ComicData['characters'] = [];
  for (const panel of panels) {
    for (const char of panel.characters ?? []) {
      const key = char.character as ComicData['characters'][number];
      if (VALID_CHARACTERS.has(key) && !seen.has(key)) {
        seen.add(key);
        result.push(key);
      }
    }
  }
  return result;
}

export function parseComicMetadata(
  dirName: string,
  panelsJson: RawPanelsJson,
  comicNumber: number,
  comicFullImageRelPath: string,
): { id: string; data: ComicData; transcript: string } {
  const slug = dirName.replace(/^\d+_/, '') || 'comic';
  const id = `${String(comicNumber).padStart(4, '0')}-${slug}`;
  const rawDate = panelsJson.publishDate ?? panelsJson.date;
  const publishDate = rawDate ? new Date(rawDate) : undefined;

  const altText = (panelsJson.altText ?? panelsJson.alt_text ?? panelsJson.title).trim();
  const transcript = buildTranscript(panelsJson.panels ?? []);
  const characters = extractCharacters(panelsJson.panels ?? []);

  const data: ComicData = {
    comicNumber,
    title: panelsJson.title,
    image: comicFullImageRelPath,
    altText,
    characters,
  };
  if (publishDate && !Number.isNaN(publishDate.getTime())) {
    data.publishDate = publishDate;
  }
  if (panelsJson.hoverText) {
    data.hoverText = panelsJson.hoverText;
  }

  return { id, data, transcript };
}

export function scanComicSrc(comicSrcDir: string): ComicSrcRecord[] {
  if (!existsSync(comicSrcDir)) return [];
  const entries = readdirSync(comicSrcDir, { withFileTypes: true });
  const dirNames = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const records: ComicSrcRecord[] = [];
  let nextComicNumber = 1;

  for (const dirName of dirNames) {
    const fullDir = join(comicSrcDir, dirName);
    const statusPath = join(fullDir, 'status.json');
    const panelsPath = join(fullDir, 'panels.json');
    const fullImagePath = join(fullDir, 'comic_full.png');

    if (!existsSync(statusPath) || !existsSync(panelsPath) || !existsSync(fullImagePath)) {
      continue;
    }

    try {
      const status = JSON.parse(readFileSync(statusPath, 'utf8'));
      if (status?.stage !== 8) {
        continue;
      }
      const panelsJson: RawPanelsJson = JSON.parse(readFileSync(panelsPath, 'utf8'));
      const comicNumber = nextComicNumber++;
      const slug = dirName.replace(/^\d+_/, '') || 'comic';
      const imageRelPath = `/comics/${String(comicNumber).padStart(4, '0')}-${slug}.png`;

      const { id, data, transcript } = parseComicMetadata(
        dirName,
        panelsJson,
        comicNumber,
        imageRelPath,
      );

      records.push({
        dirName,
        id,
        comicNumber,
        data,
        transcript,
        fullImagePath,
      });
    } catch {
      // Ignore unreadable comic folder
    }
  }

  return records;
}

export function syncComicImages(
  comics: ComicSrcRecord[],
  publicComicsDir: string,
): void {
  mkdirSync(publicComicsDir, { recursive: true });
  for (const comic of comics) {
    const dest = join(publicComicsDir, basename(comic.data.image));
    if (existsSync(dest)) {
      const srcStat = statSync(comic.fullImagePath);
      const destStat = statSync(dest);
      if (srcStat.size === destStat.size && srcStat.mtimeMs <= destStat.mtimeMs) {
        continue;
      }
    }
    copyFileSync(comic.fullImagePath, dest);
  }
}

export function comicSrcLoader(options?: {
  comicSrcDir?: string;
  publicComicsDir?: string;
}): Loader {
  return {
    name: 'comic-src-loader',
    load: async ({ store, parseData, renderMarkdown, generateDigest }) => {
      const baseDir = process.cwd();
      const defaultComicSrc = existsSync(resolve(baseDir, 'comic_src'))
        ? resolve(baseDir, 'comic_src')
        : resolve(baseDir, '../comic_src');
      const defaultPublicComics = existsSync(resolve(baseDir, 'public/comics'))
        ? resolve(baseDir, 'public/comics')
        : resolve(baseDir, 'website/public/comics');

      const comicSrcDir = options?.comicSrcDir ?? defaultComicSrc;
      const publicComicsDir = options?.publicComicsDir ?? defaultPublicComics;

      const records = scanComicSrc(comicSrcDir);
      syncComicImages(records, publicComicsDir);

      store.clear();
      for (const record of records) {
        const parsedData = (await parseData({
          id: record.id,
          data: record.data as unknown as Record<string, unknown>,
        })) as unknown as ComicData;
        const rendered = await renderMarkdown(record.transcript);
        const digest = generateDigest({
          data: parsedData as unknown as Record<string, unknown>,
          body: record.transcript,
        });

        store.set({
          id: record.id,
          data: parsedData as unknown as Record<string, unknown>,
          body: record.transcript,
          rendered,
          digest,
        });
      }
    },
  };
}
