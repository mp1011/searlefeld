---
status: Not Started
subtask_of: plans/initial_website/plan.md
---

# Social Preview Metadata and RSS Feed

## Goal
Pasting a comic's link into a chat app shows a preview card with its title, description and strip image, and the user can subscribe to `/rss.xml` in a feed reader.

## Context
- Depends on `comic_permalinks_and_navigation.md`. Parent: `agent_docs/plans/initial_website/plan.md`.
- This is requirement 4 of `agent_docs/plans/decide_website_stack.md`. Hosting is out of scope, so the production domain is unknown: read the site URL from Astro's `site` config with a placeholder default (e.g. `http://localhost:4321`) so the absolute URLs become correct once hosting is decided.
- Use `@astrojs/rss` for the feed.

## Requirements
1. `BaseLayout` accepts title/description/image props and emits `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:image` (absolute URL), `og:url`, `og:type` and `twitter:card` (`summary_large_image`).
2. Each `/comic/<n>` page fills these from the comic (its title, its alt text or first transcript line as the description, and its strip image); other pages use site defaults.
3. `/rss.xml` is a valid RSS 2.0 feed with one item per comic, newest first, each linking to its permalink with the image in the description.
4. Every page has a `<link rel="alternate" type="application/rss+xml">`, and the footer shows an RSS link.

## Implementation Plan
Add a pure `buildMeta(comic | null, site)` helper that returns the tag values and is used by `BaseLayout`; `rss.xml.ts` uses the sorted-comics helper.

## Testing Plan
- Vitest: `buildMeta` for a comic with site `https://example.com` returns an `og:image` of `https://example.com/comics/<file>.png` and the comic's title; `buildMeta(null, site)` returns the site defaults.
- Build test: `dist/comic/1/index.html` contains an `og:title` equal to comic 1's title and an absolute `og:image` URL.
- Build test: `dist/rss.xml` parses as XML, has one `<item>` per comic, and its first item is the latest comic.

## Verification Plan
`npm test` and `npm run build` pass in `website/`. The user opens `/rss.xml` under `npm run dev` to see the feed, and inspects a comic page's `<head>` for the OG tags.
