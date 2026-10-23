---
status: Done
subtask_of: plans/initial_website/plan.md
---

# Archive Page

## Goal
The user opens `/archive` and sees every comic in order as a thumbnail grid with its number, title and date, each linking to its permalink.

## Context
- Depends on `scaffold_astro_site_with_sample_comics.md` and on the `/comic/<number>` routes from `comic_permalinks_and_navigation.md`. Parent: `agent_docs/plans/initial_website/plan.md`.
- Thumbnails can be the full placeholder images scaled down with CSS; an image pipeline is out of scope.

## Requirements
1. `/archive` lists all comics in ascending `comicNumber` order.
2. Each entry shows a thumbnail (with the comic's alt text), its number, title and formatted publish date, and links to `/comic/<number>`.
3. The grid is responsive: one column at phone width, several on desktop, and no horizontal scroll.
4. The header's Archive link is marked as the current page while on `/archive`.

## Implementation Plan
Reuse the sorted-comics helper, add a date-format helper, and render a CSS grid.

## Research
- Reused `website/src/lib/comics.ts` and `BaseLayout.astro`; existing header had no current-page marker.
- Added `src/lib/dates.ts` with explicit en-US/UTC formatting and `src/pages/archive.astro` with an ordered thumbnail grid.
- Preserved the pre-existing uncommitted about/cast work and extended the shared build test.

## Testing Plan
- Vitest: the date-format helper turns `2026-10-22` into the chosen display string.
- Build test: `dist/archive/index.html` contains one link per comic, in ascending order, each with `href="/comic/<n>"` and an `<img>` whose `alt` matches that comic's `altText`.
- Build test: the Archive header link in `dist/archive/index.html` carries `aria-current="page"`.

## Verification Plan
`npm test` and `npm run build` pass in `website/`. The user opens `/archive` under `npm run dev` at desktop and phone widths and clicks a thumbnail to land on that comic.

## Verification Results
- Confirmed red phase: date formatter threw the scaffold error and archive build test failed because the route did not exist.
- `npm test`: all 18 tests passed. `npm run check`: zero errors, warnings or hints. `npm run build`: seven pages emitted.
- Chromium rendered the built HTML from local files, without starting a server: 390px viewport had one column; 1280px had three. Neither overflowed horizontally, and all three thumbnails loaded.
- Generated output tests verify one permalink per comic in ascending order, image alt text, number, title, ISO/display date and the Archive current-page marker; all linked comic pages are emitted.
- No heavy suite or verify/run skill is available. Live dev-server click-through remains a user review step under the repository's user-only dev-server rule.
