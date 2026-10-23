---
status: Ready for Review
subtask_of: plans/initial_website/plan.md
---

# Scaffold Astro Site With Sample Comics

## Goal
The user runs `npm run dev` in `website/` and sees the Searlefeld home page in a browser. It shows the latest placeholder comic with its title, alt text, hover text and transcript, inside a site header and footer.

## Context
- Stack decision: `agent_docs/plans/decide_website_stack.md` and `agent_docs/deep_dives/website_tech_stack.md` (file layout, Zod schema). Parent: `agent_docs/plans/initial_website/plan.md`.
- Scope is local only: no Cloudflare workflow, no hosting config.
- No real comics exist yet. Placeholder strip images are the PNGs in `agent_docs/comic_notes/comic_tests/` and `agent_docs/comic_notes/reference_images/` (e.g. `nvidia-v1.png`, `nvidia-v2.png`, `nvidia-comic-reference-v1.png`). **Copy** them into `website/public/comics/`; never move or edit the originals.
- Placeholder titles and transcripts come from the scripts in `agent_docs/comic_notes/situations/`.
- Every later subtask in this folder builds on this one.

## Requirements
1. An Astro project (TypeScript, `output: 'static'`) lives in `website/` with `dev`, `build`, `check` (`astro check` / `tsc --noEmit`) and `test` (Vitest) npm scripts.
2. A `comics` content collection uses the schema from the deep dive (`comicNumber`, `title`, `publishDate`, `image`, `altText`, optional `hoverText`, `characters`); the Markdown body is the transcript.
3. At least three placeholder comics, numbered consecutively from 1, each pointing at a copied placeholder image.
4. `BaseLayout`, `Header` (site name, links to Home / Archive / About) and `Footer` components; all pages share one responsive layout built on CSS custom properties, with light/dark theme support.
5. `/` renders the highest-numbered comic through a `ComicViewer` component: the title, the image with `alt`, a `title` attribute set to the hover text, and the transcript in an accessible, collapsible section.
6. A comic with a missing required field or a duplicate `comicNumber` fails the build with a clear error.
7. The "How to run things" and "Top-Level Repository Layout" sections of `agent_docs/00_start_here.md` list the real install/dev/build/test commands, and `.gitignore` covers `node_modules/`, `dist/` and `.astro/`.

## Implementation Plan
Scaffold with `npm create astro@latest` (minimal template) into `website/` and add Vitest. Put the comic lookup helpers (sorted list, latest, by number) in a small TS module so later subtasks can reuse them. Duplicate-number detection lives in that helper and throws at build time.

## Testing Plan
- Vitest: given comic entries out of order, the helper returns them sorted by `comicNumber`, and `latest()` returns the highest number.
- Vitest: given two entries that share a `comicNumber`, the helper throws an error naming the duplicate number.
- Vitest: the schema rejects an entry missing `altText` and accepts a complete entry.
- Build test: `npm run build` succeeds, and the emitted `dist/index.html` contains an `<img>` whose `src` is the latest comic's image and whose `alt` equals its `altText`.

## Verification Plan
In `website/`: `npm install`, `npm run check`, `npm test` and `npm run build` all pass. The user runs `npm run dev` and opens `/` to see the latest placeholder comic, the header and the footer.
