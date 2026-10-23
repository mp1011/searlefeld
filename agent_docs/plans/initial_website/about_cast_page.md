---
status: Done
subtask_of: plans/initial_website/plan.md
---

# About and Cast Page

## Goal
The user opens `/about` and reads what Searlefeld is, with a card for each of the four main characters showing a reference image and a short description.

## Context
- Depends on `scaffold_astro_site_with_sample_comics.md` (layout, header). Parent: `agent_docs/plans/initial_website/plan.md`.
- Premise text: `agent_docs/comic_notes/README.md`. Character details: `agent_docs/comic_notes/characters/*.md`.
- Placeholder portraits: copy `roko-turnaround-v1.png`, `max-turnaround-v1.png`, `ailan-turnaround-v1.png`, `chinese-room-front-v1.png` and `cast-portrait-v1.png` from `agent_docs/comic_notes/reference_images/` into `website/public/cast/`. Never move or edit the originals.

## Requirements
1. `/about` shows the series premise and the cast group image.
2. There is one card each for Roko, Max, Ailan and Chinese Room, with the name, an image with descriptive alt text, and a one- or two-sentence blurb drawn from the comic notes.
3. Cast data lives in one typed data module whose keys match the `characters` enum in the comics schema, not in hard-coded markup.
4. Each card lists links to the comics that character appears in (from each comic's `characters` field); a character with no comics shows no list.
5. The footer's cast link and the header's About link both go to `/about`.

## Implementation Plan
Add a `cast.ts` data module and a helper that maps a character key to its comics, and render each card with a `CastCard` component.

## Testing Plan
- Vitest: given comics tagged `["roko","max"]` and `["max"]`, the appearances helper returns both comics for `max`, one for `roko` and none for `ailan`.
- Vitest: every key in the cast module is a valid value of the comics schema's `characters` enum.
- Build test: `dist/about/index.html` contains four cast cards, each with an `<img>` that has a non-empty `alt`.

## Verification Plan
`npm test` and `npm run build` pass in `website/`. The user opens `/about` under `npm run dev` and sees four cast cards with images and comic links.

## Research

- The schema lives in `website/src/lib/comicSchema.ts`; cast keys derive from `ComicData['characters'][number]`, excluding the non-cast `other` tag.
- Existing numeric comic permalinks use `/comic/{comicNumber}`. The About page sorts comics before filtering appearances so each list follows comic number order.
- The header already linked to `/about`; the footer needed its Cast link.
- Canonical portraits are copied byte-for-byte into `website/public/cast/`; originals stay untouched.

## Verification Results

- Confirmed the red phase: the appearances helper threw `not implemented` and the build lacked `/about/index.html`.
- Automated coverage observes helper outputs and generated HTML: four cards, non-empty image alt text, the expected comic links per character, header/footer links, and byte-identical published portraits.
- `npm test`, `npm run check`, and `npm run build` pass. No heavy test suite is configured.
- No `verify` or `run` skill is available in this session. Verified the generated static output through the build tests; visual browser review remains for the user under their dev server, which agents must not start.
