---
status: Done
---

# GOAL
Replace the placeholder comics with the comics from `comic_src`.

Show any comic who's status.json has stage 8.

Use transcript from panels.json.

## Research
- `comic_src/` contains strip workspaces produced by the image creator CLI (`000_nvidia`, `001_human`).
- Each comic directory has:
  - `status.json`: records `"stage": 8` upon completion of all generation and stitching steps.
  - `panels.json`: contains comic title, panel layouts, backgrounds, characters, and dialogue per character.
  - `comic_full.png`: final stitched strip image.
- Currently, Astro uses a `glob` loader in `website/src/content.config.ts` loading from `website/src/content/comics/`, which contains placeholder `.md` files (`0001-nvidia.md`, `0002-lunch.md`, `0003-birthday.md`), and placeholder images in `website/public/comics/`.
- Astro 5+ supports custom collection loaders via `defineCollection({ loader: customLoader(), schema: comicSchema })`.
- A custom loader can inspect `comic_src/`, filter for directories with `status.stage === 8`, parse `panels.json`, extract transcript lines (`<Speaker>: <dialogue>`), extract characters, ensure `comic_full.png` is placed in `website/public/comics/`, and register data entries in Astro's data store.

## Context
- `website/src/content.config.ts`: collection definitions.
- `website/src/lib/comicSchema.ts`: Zod validation schema for comic metadata.
- `website/src/lib/comicLoader.ts`: new custom loader and sync logic.
- `website/src/components/ComicViewer.astro`, `website/src/pages/index.astro`, `website/src/pages/comic/[slug].astro`, `website/src/pages/archive.astro`, `website/src/pages/rss.xml.ts`.
- `website/tests/build.test.ts`: end-to-end static build verification.

## Implementation Plan
1. Create `website/src/lib/comicLoader.ts` with pure helpers and the Astro custom loader:
   - `readComicSrc`: scans `comic_src/`, filters for `status.stage === 8`, parses `panels.json`.
   - `buildTranscript`: extracts non-empty character dialogue from panels formatted as `<Speaker>: <dialogue>`.
   - `extractCharacters`: extracts unique characters matching the schema enum.
   - `syncComicImages`: copies `comic_full.png` for stage 8 comics into `website/public/comics/` with clean naming `${comicNumberPadded}-${slug}.png`.
   - `comicSrcLoader`: custom Astro loader implementing `Loader` interface to populate Astro's content store.
2. Update `website/src/content.config.ts` to use `comicSrcLoader()` instead of `glob()`.
3. Clean up placeholder comics: remove placeholder `.md` files in `website/src/content/comics/` and placeholder images in `website/public/comics/`.
4. Update `website/tests/build.test.ts` to assert against the real comics (`Credit Where It's Due`, `Human Speak`).
5. Update `website/src/pages/index.astro` error message from "in src/content/comics" to general "No comics found".

## Testing Plan
- Unit tests in `website/tests/comicLoader.test.ts` covering:
  - Filtering stage 8 vs non-stage 8 comics.
  - Transcript extraction from `panels.json` dialogue.
  - Character list extraction.
  - Metadata parsing (comicNumber, title, altText fallback, publishDate).
- Build and navigation tests in `website/tests/build.test.ts` checking:
  - Successful `npm run build`.
  - Latest comic displayed on `/` is #2 `Human Speak`.
  - Permalinks `/comic/1` and `/comic/2` generated with correct navigation links.
  - Archive grid displaying both comics with correct titles, dates, and thumbnails.
  - RSS feed containing both comics newest first.
  - About page cast appearances reflecting the real strips.