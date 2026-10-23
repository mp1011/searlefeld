---
status: Done
subtask_of: plans/initial_website/plan.md
---

# Comic Permalinks and Navigation

## Goal
The user can open any comic at `/comic/<number>` and move between strips with the First / Previous / Random / Next / Latest buttons or the keyboard arrow keys.

## Context
- Depends on `scaffold_astro_site_with_sample_comics.md` (comic helpers, `ComicViewer`, layout).
- Routing behavior is specified in `agent_docs/deep_dives/website_tech_stack.md` ("Navigation & Routing Behavior"). Parent: `agent_docs/plans/initial_website/plan.md`.
- The site is static, so Random must work without a server. One option is a tiny inline script that picks from a build-time list of numbers, with a no-JS fallback link.

## Requirements
1. `src/pages/comic/[slug].astro` statically generates one page per comic at `/comic/<comicNumber>`.
2. `ComicNav` shows `|<<` First, `<` Prev, `?` Random, `>` Next and `>>|` Latest on both `/` and every permalink.
3. Prev and First are visibly disabled (and are not links) on comic 1; Next and Latest are disabled on the latest comic.
4. Random never lands on the comic currently shown when more than one comic exists.
5. The Left/Right arrow keys go to Prev/Next. The nav can be reached and operated with Tab/Enter and has accessible labels.
6. Unknown numbers (e.g. `/comic/999`) show a friendly 404 page with a link home.

## Implementation Plan
Write the nav-target computation (`first`, `prev`, `next`, `latest`, random-excluding-current) as pure functions in the comic helper module; the Astro component only renders their output. Keyboard and random handling go in one small inline script.

## Testing Plan
- Vitest: for comics [1,2,3] with current=1, prev/first are null, next=2 and latest=3; with current=3, next/latest are null; with current=2, all four are set.
- Vitest: random-excluding-current with an injected RNG never returns the current number over many draws, and returns the only comic when there is just one.
- Build test: `npm run build` emits one `dist/comic/<n>/index.html` per comic; `dist/comic/1/index.html` has a Next link to `/comic/2` and no Prev link.
- Build test: `dist/404.html` exists and contains a link to `/`.

## Verification Plan
`npm test` and `npm run build` pass in `website/`. The user runs `npm run dev`, clicks every nav button, presses the arrow keys, and opens `/comic/999` to see the 404 page.
