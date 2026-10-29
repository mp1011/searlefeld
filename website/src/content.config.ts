import { defineCollection } from 'astro:content';
import { comicSchema } from './lib/comicSchema';
import { comicSrcLoader } from './lib/comicLoader';

const comics = defineCollection({
  loader: comicSrcLoader(),
  schema: comicSchema,
});

export const collections = { comics };
