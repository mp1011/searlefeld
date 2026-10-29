# Website Visual Style

The look the user approved on 2026-10-29 (plan: `agent_docs/plans/website_round2/overall_layout.md`), called "A2" during review: **warm loft colors with square, terminal-style shapes and monospace chrome**. Follow it for any new page or component.

## Where things live
- **Color tokens**: `website/src/lib/theme.ts`. `lightTheme` and `darkTheme` are the single source of truth. `themeCss()` turns them into `--kebab-case` custom properties: light on `:root`, dark under `prefers-color-scheme: dark`. `BaseLayout.astro` inlines it in `<head>`. Never hard-code a hex value in a component. Use the tokens: `--bg --surface --fg --muted --line --accent --accent-text --accent-ink --sage`.
- **Fonts**: self-hosted through `@fontsource/*` imports in `BaseLayout.astro`, exposed as `--display` (Fredoka), `--body` (Nunito) and `--mono` (IBM Plex Mono). Add a weight by importing its `@fontsource/<family>/<weight>.css`.
- **Global rules**: `BaseLayout.astro` (headings use `--display`, links use `--accent-text`, focus ring, the shared `.eyebrow` class).

## Rules of thumb
- `--accent` (logo orange) is for borders, rules and fills only. On cream it does not reach WCAG AA for text. Orange text and hover fills use `--accent-text`. `tests/theme.test.ts` enforces AA (4.5:1) for every text/background pair; add a pair there when you introduce one.
- Use mono for site chrome only: nav, comic buttons, eyebrows (`Comic #N`), transcript speaker names, footer. Use Fredoka for titles, Nunito for reading text.
- Shapes are square: no `border-radius`. Panels are `--surface` with a 1px `--line` border. The comic strip gets the double-line frame (`box-shadow` rings). Interactive outlines fill on hover.
- Secondary/"random" actions and eyebrows use `--sage`.

## Verifying visually
No dev server is allowed. Copy `website/dist` into the scratchpad and rewrite root-relative URLs to `file://` URLs. Strip the `<script type="module">` tags, because the banner rotation sets root-relative image URLs that break under `file://`. Then screenshot with headless Chrome (`--screenshot --window-size=W,H`, plus `--blink-settings=preferredColorScheme=0` for dark). Headless Chrome on Windows will not go narrower than about 500px, so phone checks at `--window-size=400,…` crop the page and look like horizontal overflow. Use 500.
