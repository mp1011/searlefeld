# Website Tech Stack Decision & Architecture

## Overview & Context

Searlefeld is a webcomic series featuring four AI thought experiments (Roko, Max, Ailan, and Chinese Room) living together in a New York-style apartment. The MVP website needs to host and showcase comic strips with an extremely simple design, no backend servers, and continuous deployment to Cloudflare Pages via GitHub Actions.

## Requirements & Constraints

1. **No backend in MVP**: All comic images and metadata must be statically pre-rendered and hosted directly.
2. **Minimalist design**: The website has one primary function: cleanly display comic strips with intuitive navigation and fast load times.
3. **Automated Cloudflare publishing**: The site must automatically build and deploy to Cloudflare Pages on git push via GitHub Actions.
4. **Social & SEO friendliness**: Sharing a link to any comic strip must display rich Open Graph preview cards (title, thumbnail image, description).
5. **Accessibility**: First-class support for image alt text, transcripts, and keyboard navigation.

---

## Selected Tech Stack

| Layer | Selection | Rationale |
|---|---|---|
| **Static Site Generator** | **Astro** (TypeScript) | Zero client-side JS by default, native Content Collections with type-safe schema validation (Zod), blazing fast build times, and built-in SSG. |
| **Language** | **TypeScript** | Type safety across comic schemas, metadata validation, and routing helpers. |
| **Styling** | **Scoped Astro CSS & Custom Properties** | Zero styling dependencies or build plugin friction; clean, responsive layout with dark/light theme support. |
| **Hosting Platform** | **Cloudflare Pages** | Ultra-fast global edge CDN, unlimited bandwidth on free tier, instant cache invalidation, custom domains, and zero backend maintenance. |
| **CI / CD** | **GitHub Actions** (`cloudflare/wrangler-action`) | Push-to-deploy workflow on `main` branch to automatically build and deploy to Cloudflare Pages. |
| **Testing & Linting** | **Vitest** + **TypeScript compiler check** (`tsc --noEmit`) | Fast testing for comic navigation math, URL routing, schema validation, and RSS feed generation. |

---

## Why Astro vs Alternatives?

1. **Astro vs Next.js / Nuxt / SvelteKit**:
   - Next.js and Nuxt are optimized for hybrid server-side rendering (SSR) and server components. For a pure static comic site, they introduce unnecessary build complexity, heavier runtime footprints, and potential deployment mismatch on Cloudflare edge workers.
   - Astro is content-first and outputs pure static HTML/CSS with zero runtime JavaScript by default.
2. **Astro vs Vite + React SPA**:
   - A single-page application (SPA) renders client-side. When users share comic links on Twitter/X, Discord, or Reddit, web crawlers may fail to parse client-side meta tags, breaking preview cards. Astro generates dedicated static HTML files per comic with full OpenGraph/Twitter card metadata.
3. **Astro vs 11ty (Eleventy)**:
   - While 11ty is also pure static, Astro provides modern component composition, native TypeScript support, and type-safe Content Collections with Zod schemas. If interactive widgets are needed later (e.g. keyboard shortcuts, random strip button), Astro Islands allow adding lightweight micro-scripts without re-architecting.

---

## Content & Data Architecture

Comics are stored directly in the repository as part of Astro's Content Collections.

### File Structure

```
website/
├── public/
│   ├── favicon.svg
│   └── comics/
│       ├── 0001-the-symbol-book.png
│       └── 0002-paperclip-budget.png
├── src/
│   ├── content/
│   │   ├── config.ts              # Zod collection schema
│   │   └── comics/
│   │       ├── 0001-the-symbol-book.md
│   │       └── 0002-paperclip-budget.md
│   ├── components/
│   │   ├── ComicViewer.astro      # Strip image, alt text, title
│   │   ├── ComicNav.astro         # First, Prev, Random, Next, Latest
│   │   ├── Header.astro           # Site branding & main nav
│   │   └── Footer.astro           # Copyright, cast links, RSS link
│   ├── layouts/
│   │   └── BaseLayout.astro       # HTML shell, OpenGraph/SEO tags, responsive CSS
│   └── pages/
│       ├── index.astro            # Home page: displays latest comic strip
│       ├── comic/
│       │   └── [slug].astro       # Individual strip permalink (/comic/1, /comic/2)
│       ├── archive.astro          # Chronological list / thumbnail grid
│       ├── about.astro            # Cast intro & project background
│       └── rss.xml.ts             # RSS 2.0 feed for comic readers
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

### Comic Metadata Schema (`src/content/config.ts`)

```typescript
import { defineCollection, z } from 'astro:content';

export const comicsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    comicNumber: z.number().int().positive(),
    title: z.string(),
    publishDate: z.date(),
    image: z.string(), // e.g. "/comics/0001-the-symbol-book.png"
    altText: z.string(),
    hoverText: z.string().optional(), // Classic webcomic tooltip
    characters: z.array(z.enum(['roko', 'max', 'ailan', 'chinese_room', 'other'])).default([]),
  }),
});

export const collections = {
  comics: comicsCollection,
};
```

The Markdown body of each comic file (`0001-the-symbol-book.md`) contains the text transcript for screen readers and search indexing.

---

## Navigation & Routing Behavior

Each comic strip permalink (`/comic/[slug]`) and the home page (`/`) provide a standard 5-button comic navigation bar:
- `|<<` **First**: Links to comic #1 (`/comic/1`)
- `<` **Previous**: Links to `current - 1` (disabled on first comic)
- `?` **Random**: Selects a random comic ID
- `>` **Next**: Links to `current + 1` (disabled on latest comic)
- `>>|` **Latest**: Links to the highest numbered comic / home page

---

## Cloudflare Pages & GitHub Actions CI/CD

Deployment is fully automated using GitHub Actions. No manual FTP or server management is required.

### Deployment Workflow (`.github/workflows/deploy-pages.yml`)

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run build & static checks
        run: npm run build

      - name: Deploy to Cloudflare Pages
        if: github.ref == 'refs/heads/main'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=searlefeld
```

### Required GitHub Secrets
1. `CLOUDFLARE_API_TOKEN`: Cloudflare API token with `Cloudflare Pages: Edit` permissions.
2. `CLOUDFLARE_ACCOUNT_ID`: The Cloudflare Account ID where the Pages project resides.

---

## Implementation Roadmap (Subtasks)

### Rotating website banner

`Header.astro` includes `SiteBanner.astro` above the existing site navigation on
every page. Tight 6:1 crops from `comic_notes/reference_images/banner/` are
served as 1620 × 270 WebP assets in `website/public/banners/`. Preserve the
standalone logo design and Chinese Room's canonical Listening face when replacing
these assets. The image scales intact up to the shared 60rem width and sits
flush at the upper-left viewport edge rather than centered. Full source images
and earlier 4:1 crops remain available; the ensemble v3 source lowers its logo
to keep the faces visible within the shallower crop.

`src/lib/banner.ts` rotates apartment, ensemble and lineup on successive page
loads using the per-tab `searlefeld-banner-index` sessionStorage key. Storage
failure and JavaScript-disabled browsers keep the first image. Explicit image
dimensions reserve space. Unit tests cover rotation and fallbacks; build tests
execute the shipped script and verify accessible image markup and static assets.

Above 60rem, a responsive `picture` selects matching 2430 × 270 lossless WebP
variants. The original occupies the first 1620 columns unchanged; the added
810 columns use generated chair/sofa continuations from
`comic_notes/reference_images/banner/continuations/` (including adjacent prompt
records). The continuation is resized uniformly, its boundary colors matched
over a short join, and gradually blurred and faded farther to the right.
Furniture contours continue across the join; no object or edge column is stretched. Regenerate with
`node scripts/extend-banners.mjs` from the repository root. Pixel tests compare
the decoded original region byte-for-byte and check the alpha transition.
The wide image renders at 90rem × 10rem, clipped by the viewport, so the
original composition stays at 60rem × 10rem. The banner's warm `#e9dfcc`
background fills the rest of any wider viewport. Below or at 60rem, browsers
select the original images and retain the existing 6:1 scaling. Rotation
updates both sources together, including after resizing the viewport.

### Archive implementation

`website/src/pages/archive.astro` uses `sortedComics` to render an ordered
thumbnail grid linking to numeric comic permalinks. `src/lib/dates.ts` formats
publish dates with an explicit English locale and UTC timezone, avoiding a
previous-day display on machines west of UTC. Each date also has an ISO
`datetime` value. The grid uses one column up to 40rem, two up to 48rem, and
three above that; images retain their full content with `object-fit: contain`.
The header marks Archive current for both `/archive` and `/archive/`.
Date unit tests and generated-HTML build tests cover metadata and navigation.

### About and cast implementation

`website/src/lib/cast.ts` holds the four typed cast records and the pure
`appearances(comics, character)` filter. Character keys derive from the comics
schema; `other` is a comic tag rather than a cast member. The caller controls
comic ordering. `/about` supplies comics sorted by number to `CastCard.astro`,
which omits the appearances section when its list is empty. Portraits are
unchanged copies of the canonical reference images in `public/cast/`.
`tests/cast.test.ts` covers the filter and schema compatibility;
`tests/build.test.ts` checks the generated page, links, alt text and image copies.

### Social metadata and RSS implementation

`src/lib/meta.ts` provides pure `buildMeta(comic | null, site)` metadata, using
alt text or the first nonempty transcript line for comic descriptions. The
site defaults use the cast portrait. `BaseLayout.astro` renders description,
Open Graph and Twitter card tags, accepts title/description/image overrides,
and adds RSS discovery to every page. Comic permalinks pass their comic entry;
the home page uses site defaults. The footer links to `/rss.xml`.

`src/pages/rss.xml.ts` uses `@astrojs/rss` and reversed `sortedComics` results
for a newest-first RSS 2.0 feed. Each description includes escaped text and
an absolute image URL. All origins come from Astro's `site` config, currently
`http://localhost:4321`; replace that placeholder when choosing hosting.
Unit tests cover metadata defaults and transcript fallback; build tests inspect
rendered metadata and parse/validate the feed with `fast-xml-parser`.

1. **Subtask 1: Initialize Astro Website Skeleton & Comic Content Schema**
   - Initialize Astro with TypeScript under `website/` (or repository root).
   - Configure Content Collections with Zod schema (`comicNumber`, `title`, `publishDate`, `image`, `altText`, `transcript`).
   - Add sample comic strips.

2. **Subtask 2: Comic Viewer & Navigation Component**
   - Implement `ComicViewer` and `ComicNav` (First, Prev, Random, Next, Latest).
   - Build `/comic/[slug]` dynamic route and `/` (latest comic).
   - Add archive page (`/archive`) and about page (`/about`).

3. **Subtask 3: Cloudflare Pages Deployment Workflow & SEO / RSS**
   - Create GitHub Actions workflow `.github/workflows/deploy-pages.yml`.
   - Add OpenGraph social meta tags and `/rss.xml` feed generation.
   - Validate production static build (`npm run build`).
