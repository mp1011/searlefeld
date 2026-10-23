# PROJECT STRUCTURE

This is a practical map of the repository, organized by the three major project areas plus agent/repo tooling. Summaries are intentionally brief.

## Major Areas & Directories

### 1. Characters, Story and Environment (`agent_docs/comic_notes/`)
- `agent_docs/comic_notes/README.md` — Premise and core cast overview (Roko, Max, Ailan, Chinese Room).
- `agent_docs/comic_notes/characters/` — Character personalities, physical appearance notes, and comedic voice (`roko.md`, `max.md`, `ailan.md`, `chinese_room.md`, `secondary characters/`).
- `agent_docs/comic_notes/situations/` — Loose Markdown scene scripts used as input to comic creation (`nvidia.md`, `still_got_it.md`, `paperclips.md`, etc.).
- `agent_docs/comic_notes/reference_images/` — Canonical character turnaround sheets and apartment/loft angle reference PNGs.
- `agent_docs/comic_notes/comic_tests/` — Early test comic renders and prompt experiments.

### 2. Website (`website/`)
- `website/src/content/config.ts` — Astro Content Collection Zod schema for comic strips.
- `website/src/content/comics/` — Per-comic Markdown entries (frontmatter metadata + transcript body).
- `website/public/comics/` — Static comic strip PNG images served by the site.
- `website/src/components/` — Astro UI components (`Header.astro`, `Footer.astro`, `ComicViewer.astro`, `ComicNav.astro`).
- `website/src/layouts/` — Shared page layouts (`BaseLayout.astro`).
- `website/src/pages/` — Static routes (`/`, `/comic/[slug]`, `/archive`, `/about`, `/rss.xml.ts`).
- `agent_docs/deep_dives/website_tech_stack.md` — Full website architecture and stack specification.

### 3. Image Creator (`tools/comic/`, `comic_assets/`, `comics_src/`)
- `tools/comic/` — TypeScript CLI and modules for the 7-stage human-gated comic generation pipeline (parsers, prompt assembly, AI image providers, SVG/`sharp` speech bubble renderer, and strip compositor).
- `comic_assets/references/manifest.json` — Maps character and location names to reference images in `agent_docs/comic_notes/reference_images/`.
- `comics_src/<NNNN-slug>/` — Per-strip workspace containing `strip.json` gate state and stage outputs (`01_layout.md` through `07_final/strip.png`).
- `agent_docs/deep_dives/comic_generation_stack.md` — Full 7-stage pipeline specification and architecture.

### Agent Docs & Repo Tooling (`agent_docs/`, `scripts/`)
- `agent_docs/00_start_here.md` — Session startup rules, area routing table, and task quick reference.
- `agent_docs/01_overview.md` — One-page overview of Searlefeld and its three repository areas.
- `agent_docs/instructions/` — Workflow instructions (`low_trust/` interactive and `high_trust/` unattended).
- `agent_docs/plans/` — Tracked implementation plans and subtasks (`initial_website/`, `image_generator/`).
- `scripts/work_dot_bat/` — Mechanical check scripts, plan status manager (`plan-status.sh`), and structure sync (`update-project-structure.sh`).

<!-- BEGIN GENERATED FILE LISTING - do not edit by hand; run scripts/work_dot_bat/update-project-structure.sh -->

<!-- END GENERATED FILE LISTING -->
