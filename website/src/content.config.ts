import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { comicSchema } from './lib/comicSchema';

const comics = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/comics' }),
  schema: comicSchema,
});

export const collections = { comics };
