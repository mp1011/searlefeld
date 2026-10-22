---
status: Ready for Review
---

# Decide Website Stack

## Goal
Establish and document the tech stack and architectural design for the Searlefeld webcomic site that fulfills all MVP specifications: zero backend, directly hosted comics, simple comic-viewing design, and automated Cloudflare Pages deployment via GitHub Actions.

## Context
- Searlefeld is a webcomic featuring 4 AI thought experiments (Roko, Max, Ailan, Chinese Room) living together in a NY-style apartment.
- See `agent_docs/comic_notes/README.md` for characters and comic premise.
- Detailed architecture and stack evaluation are documented in `agent_docs/deep_dives/website_tech_stack.md`.

## Requirements
1. **Zero backend / purely static**: Pre-render all pages and host comic assets directly in the repository/CDN with no backend server or database in MVP.
2. **Minimalist comic viewer**: Display strips with clean responsive layout, First/Prev/Random/Next/Latest navigation, archive list, and cast about page.
3. **Automated Cloudflare publishing**: Build and deploy via GitHub Actions workflow (`cloudflare/wrangler-action` or `pages-action`) to Cloudflare Pages on push to `main`.
4. **Rich Social Previews (OpenGraph)**: Each comic permalink (`/comic/[slug]`) must have static OG metadata (`og:image`, `og:title`, `og:description`) for clean link unfurls across social media and chat apps.
5. **Accessibility**: First-class support for comic alt text, markdown transcripts for screen readers, and keyboard navigation.

## Decision Summary
- **Framework**: **Astro (TypeScript)** with static export (`output: 'static'`).
  - Zero runtime client JavaScript by default for pure content pages.
  - Built-in type-safe Content Collections (Zod schema) for comic metadata and transcripts.
  - Pre-renders static HTML for every strip, enabling fast edge delivery and per-comic OpenGraph tags.
- **Styling**: Scoped Astro CSS + CSS variables for a lightweight, dependency-free responsive layout.
- **Hosting & CI/CD**: Cloudflare Pages deployed automatically via GitHub Actions on push to `main`.
- **Content Storage**: Comic metadata & transcripts in `src/content/comics/`, strip image files in `public/comics/`.

## Follow-up Implementation Plans
1. `agent_docs/plans/init_astro_website_and_schema.md`: Setup Astro, TypeScript, Content Collections schema, and sample comics.
2. `agent_docs/plans/build_comic_viewer_and_navigation.md`: Build comic viewer, navigation controls (First, Prev, Random, Next, Latest), archive, and about page.
3. `agent_docs/plans/configure_cloudflare_github_action.md`: Create `.github/workflows/deploy-pages.yml` and test build pipeline.

## Verification Plan
- Review `agent_docs/deep_dives/website_tech_stack.md` against the MVP specifications.
- Verify that every specification (no backend, simple design, Cloudflare via GitHub Actions) is satisfied by the architecture.
- Run `scripts/work_dot_bat/plan-status.sh check` to confirm frontmatter integrity.
