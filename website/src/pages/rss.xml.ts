import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { sortedComics } from '../lib/comics';
import { buildMeta } from '../lib/meta';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!);

export async function GET({ site }: APIContext) {
  const defaults = buildMeta(null, site!);
  return rss({
    title: defaults.title,
    description: defaults.description,
    site: site!,
    items: sortedComics(await getCollection('comics')).reverse().map((comic) => {
      const meta = buildMeta(comic, site!);
      return {
        title: meta.title,
        pubDate: comic.data.publishDate,
        link: `/comic/${comic.data.comicNumber}`,
        description: `<p>${escapeHtml(meta.description)}</p><img src="${escapeHtml(meta.image)}" alt="${escapeHtml(meta.description)}" />`,
      };
    }),
  });
}
