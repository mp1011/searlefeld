---
status: Done
---

# GOAL
On wider displays, use a "fadeout" effect on the banner.

# Detail
- create wider versions of the banners, exactly identical to the originals for the existing pixels, but extending to the right with a "fade to transparent" effect
- on displays small enough to fit the original banner, use the current images
- on wider displays, use the wider image, with a suitable background color so the banner spans the entire width

## Research and approach

Medium enhancement, following small-enhancement TDD. The pre-existing uncommitted
banner component, assets, rotation, and tests are the baseline and are preserved.
The original display limit is 60rem (960px at the default font size), independent
of the 1620px source resolution. Deterministic edge extension avoids regenerating
or altering cast artwork and preserves every decoded original pixel.

## Context

- `website/src/components/SiteBanner.astro`: responsive picture and full-width background.
- `website/src/lib/banner.ts`: synchronized original/wide rotation.
- `scripts/extend-banners.mjs`: reproducible lossless right-edge extension.
- `website/tests/banner-assets.test.ts`: exact original-pixel and transparency checks.

## Implementation and testing

- Added three 2430 × 270 wide variants, with an 810px smooth alpha fade.
- Final review correction: used built-in image_gen to draw natural continuations
  of the cream chair and sage sofa from right-edge-only references, excluding
  all cast. Saved generated PNGs and exact prompts in
  `agent_docs/comic_notes/reference_images/banner/continuations/`.
  The generator uses uniform scaling, short boundary color matching, and gradual
  softening/fading after the join. Original artwork remains byte-for-byte identical;
  furniture is drawn at the same scale instead of stretching or mirroring pixels.
  Adjacent-column continuity test reproduced the previous seam (mean channel
  difference 13.56) and now passes; far-extension variation checks reject sharp
  streaks. Inspected completed desktop banners for continuous furniture outlines.
- Select originals through 60rem; above that, display the wide image at 90rem ×
  10rem, clipping the extension when needed and filling remaining space with warm ivory.
- Rotation test failed before implementation because the wide source stayed empty.
- Pixel checks verify all original RGBA pixels and opaque/intermediate/transparent
  alpha values in the extension. Generated-page tests cover picture markup,
  shipped assets, and execution of the bundled rotation script.
- Browser regression uses Playwright with installed Chrome and intercepted static
  build responses; no server is started. Checked 390, 960, 961, 1200, 1440, and
  1920px widths: correct image selection, original scale, full viewport coverage,
  and no horizontal overflow. Checked all three wide rotations and no-JavaScript fallback.
- Inspected desktop screenshots at 1200px and 1920px. Screenshots and the temporary
  browser harness are under ignored `tmp/banner-qa/`.
- No heavy suite or verify/run skill is configured. The browser regression above
  provides end-to-end verification; permanent pixel, rotation, and build tests cover regressions.
- TaskCreate/TaskUpdate tools are unavailable in this session; phase progress is
  recorded here and reported in commentary.

## Review

Review the banner at phone and desktop widths, especially the right-edge fade.
No unimplemented recommendations remain.

Final validation: all 40 website tests passed; `npm run check` reported zero
errors and zero warnings (two existing XMLValidator deprecation hints).
The project-structure generator ran successfully and reported no tree changes.
