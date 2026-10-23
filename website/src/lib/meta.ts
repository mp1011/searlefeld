import type { ComicEntry } from './comics';

export function buildMeta(comic: ComicEntry | null, site: string | URL) {
  return {
    title: comic?.data.title ?? 'Searlefeld',
    description: comic?.data.altText.trim() || comic?.body?.split(/\r?\n/).find((line) => line.trim())?.trim() || 'Four AI thought experiments sharing an apartment.',
    image: new URL(comic?.data.image ?? '/cast/cast-portrait-v1.png', site).href,
  };
}
