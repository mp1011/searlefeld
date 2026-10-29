---
status: Done
---

# GOAL
Add a banner image to the website. Cycle between the available banner image on each reload

# Images
- draft banner images exist in `agent_docs\comic_notes\reference_images`, but these use older designs. 
- the images need to be remade not only to have a better aspect ratio for a website banner, but to also be up to date with the current character and location designs

## Research and approved assets

- User approved the updated cast, corrected standalone logo, and Chinese Room's canonical Listening face before website implementation.
- The three full banners and 4:1 crops live in `agent_docs/comic_notes/reference_images/banner/`. The user removed the obsolete v1 banners.
- Header is shared by all pages. Its new SiteBanner component displays the approved artwork above the existing navigation.

## Implementation

- Converted approved crops to 1600 × 400 WebP files in `website/public/banners/` (approximately 148–173 KiB each).
- Added accessible home link, descriptive alt text, responsive full-image scaling and explicit dimensions to reserve layout space.
- Cycle apartment → ensemble → lineup → apartment using sessionStorage across page loads in each tab. No timers or animation. JavaScript-disabled or storage-denied browsing retains a visible apartment banner.
- `website/src/lib/banner.ts` owns selection behavior; SiteBanner invokes it on page load.

## Verification

### Shorter, upper-left revision (2026-10-29)

- User confirmed rotation works and requested tighter crops and upper-left alignment.
- Added separate 6:1 crops; kept full artwork and previous 4:1 crops. Apartment and lineup use direct pixel crops. Ensemble v3 lowers the unchanged logo design so the shallow crop can retain the faces; built-in image_gen prompt is saved alongside it.
- Website assets are now 1620 × 270. Removed auto-centering margin and updated the reserved aspect ratio to 6:1. At 960px wide the banner is now 160px tall, previously 240px.
- Visually checked the updated crop set and 1200px-wide built page with banner flush to the upper-left edge. All 38 tests pass; Astro check has zero errors/warnings and the same two existing RSS deprecation hints.

- Observable: successive page loads update the displayed image URL in the expected sequence, including wraparound, invalid indices and unavailable storage.
- Static-build regression initially failed because banner assets were absent; passed after optimized assets were added.
- All 38 tests pass, including execution of the actual generated client script across simulated reloads and denied sessionStorage access, and rendered markup/assets on all six generated pages.
- `npm run check`: zero errors and warnings; two existing XMLValidator deprecation hints.
- Headless Chrome inspected built output at desktop (1200px) and narrow (500px) widths using a local preview with asset URLs adjusted for file access. No dev server started.
