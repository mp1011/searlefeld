import { z } from 'astro/zod';

export const comicSchema = z.object({
  comicNumber: z.number().int().positive(),
  title: z.string(),
  publishDate: z.date().optional(),
  image: z.string(), // e.g. "/comics/0001-nvidia.png"
  altText: z.string(),
  hoverText: z.string().optional(), // Classic webcomic tooltip
  characters: z
    .array(z.enum(['roko', 'max', 'ailan', 'chinese_room', 'other']))
    .default([]),
});

export type ComicData = z.infer<typeof comicSchema>;
