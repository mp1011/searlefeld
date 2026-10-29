---
status: Done
---

# GOAL
Work with the developer to settle on the overall look and feel of the website

## Agreed visual style (2026-10-29)
The user reviewed four mocked-up directions (warm loft, retro-tech terminal, classic webcomic, newspaper funnies) plus two hybrids, and chose **A2: warm colors with square terminal shapes and monospace chrome**. The light theme is the default. Visitors whose system is set to dark get the matching warm-dark palette.

- **Palette**: cream paper `#f7f0e3`, lighter surface `#fffaf1`, espresso text `#2e2219`, logo orange accent, sofa-sage secondary. Dark: espresso `#1e1813`, warm cream text, brighter orange.
- **Type**: Fredoka (rounded, echoing the logo) for page and comic titles. Nunito for body text. IBM Plex Mono for site chrome (nav, comic buttons, date eyebrow, transcript speaker names, footer).
- **Shapes**: square corners; outlined buttons that fill on hover; a double-line frame around the strip; transcript set off by a left orange rule; a `>` prompt before each top-nav link; 1px warm-tan rules between header/nav/footer bands.
- **Layout**: banner, then a slim nav bar (Home, Archive, About, with RSS pushed right), then one centered column: eyebrow (`Comic #N · date`), title, nav buttons, framed strip, nav buttons, transcript.

## Research
- All site styling is scoped Astro CSS plus a few global tokens in `BaseLayout.astro` (`--bg --fg --muted --border --link`). Components already read those tokens, so a token swap restyles most of the site.
- The transcript arrives as `Speaker: line` paragraphs (`comicLoader.buildTranscript`), so speaker names can be split off for styling.
- Orange `#d9661a` text on cream fails WCAG AA (about 3.4:1). Keep it for fills, borders and rules. Use a darker `accent-text` for orange text and button hover fills.
- Fonts: self-host via `@fontsource/*` packages (no third-party font requests, works offline, Vite fingerprints the files).

## Context
- `website/src/lib/theme.ts` (new): the light/dark token sets, contrast math, and the generated `:root` CSS.
- `website/src/lib/transcript.ts` (new): splits transcript paragraphs into speaker/text.
- `website/src/layouts/BaseLayout.astro`, `components/*.astro`, `pages/archive.astro`, `pages/about.astro`, `pages/404.astro`.

## Implementation Plan
1. `theme.ts` exports `lightTheme`, `darkTheme`, `contrastRatio()`, and `themeCss()`. The light tokens go on `:root` and the dark tokens under `prefers-color-scheme: dark`. BaseLayout injects the result.
2. Import Fredoka, Nunito and IBM Plex Mono from fontsource in BaseLayout and set the global type rules.
3. Restyle Header (drop the redundant text logo, since the banner carries it; add RSS), ComicViewer (eyebrow, framed strip, speaker-styled transcript), ComicNav (square outlined buttons with word labels that collapse to symbols on phones), Footer, archive grid, cast cards, about and 404.

## Testing Plan
- `theme.test.ts`: every foreground/background pair the site uses meets WCAG AA (4.5:1) in both themes. Both themes define the same tokens. `themeCss()` puts light values on `:root` and dark values inside the dark media query.
- `transcript.test.ts`: `Speaker: text` lines split into speaker and text; lines without a speaker keep the whole text; URLs and times containing colons later in the line are not split wrongly.
- `build.test.ts`: the built home page shows the `Comic #2` eyebrow, speaker-tagged transcript lines and labelled nav buttons. Every built page links a stylesheet that defines the theme tokens and `@font-face` rules for the three families, and the font files ship in `dist`.

## Verification Plan
`npm test`, `npm run check`, `npm run build`. Then screenshot the built pages (home, archive, about) at desktop and phone width in light and dark with headless Chrome.

## Implementation notes
- Implemented as planned. The header's text "Searlefeld" link was removed because the banner logo already links home. RSS moved into the top nav as well as the footer.
- The light-theme muted (`#6e5b48`) and sage (`#4f6b4d`) tokens are slightly darker than the mockup, to pass AA on cream. Orange text uses `accentText` `#a84a0c`.
- Comic nav buttons show symbol + word (`|<< First`) and collapse to symbols below 34rem. The keyboard arrows and the random-button script are unchanged.
- The date eyebrow appears only when a comic has a `publishDate`. Neither current comic has one, so they show `Comic #N` only.

## Verification
- `npm test`: 68/68 pass (new: `theme.test.ts`, `transcript.test.ts`, and two build-output tests for theme/fonts and comic labels; all failed first for the expected reason).
- `npm run check`: 0 errors, 0 warnings. `scripts/work_dot_bat/run-checks.sh`: all passed.
- Headless Chrome screenshots of the built home (light, dark, 500px phone with transcript open), archive and about (dark) pages. Layout, fonts and colors match the approved A2 mockup. No horizontal overflow at 500px.
- No heavy test suite is configured, so phase 8 was skipped.
