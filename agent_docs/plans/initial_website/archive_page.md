---
status: Not Started
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

## Testing Plan
- Vitest: the date-format helper turns `2026-10-22` into the chosen display string.
- Build test: `dist/archive/index.html` contains one link per comic, in ascending order, each with `href="/comic/<n>"` and an `<img>` whose `alt` matches that comic's `altText`.
- Build test: the Archive header link in `dist/archive/index.html` carries `aria-current="page"`.

## Verification Plan
`npm test` and `npm run build` pass in `website/`. The user opens `/archive` under `npm run dev` at desktop and phone widths and clicks a thumbnail to land on that comic.
