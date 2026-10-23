---
status: Not Started
subtask_of: plans/decide_comic_generation_stack.md
---

# Build Panel and Strip Compositor

## Goal
Run `comic compose` on a strip workspace and get a finished strip PNG (Stage 7, Final Touches) laid out per the Stage 1 grid, then export it to the website's `public/comics/` once approved.

## Context
Depends on the bubble renderer and generated layers.
Pipeline design: `agent_docs/plans/image_generator/overall.md` and `agent_docs/deep_dives/comic_generation_stack.md`. Parent decision: `agent_docs/plans/decide_comic_generation_stack.md`.

## Requirements
1. `strip.json` schema validated with Zod (stage gate statuses, panels, layers with position/scale, dialogue with speaker and anchor).
2. Panel geometry computed from the `01_layout.md` grid (`12\n34`, `12\n3`, `123`) within a fixed mobile-friendly width (800px default), with optional size weights.
3. Layers composited per panel (Stage 3 background, Stage 5 transparent characters, Stage 6 bubbles); panels laid out into a strip with borders, written to `comics_src/<slug>/07_final/strip.png`.
4. Export to `public/comics/<NNNN-slug>.png` only after Stage 7 is approved.

## Implementation Plan
Implement schema, layout geometry, panel compositor and strip layout with `sharp`.

## Testing Plan
- Invalid spec reports the offending field path (assert message).
- Layout `"12\n3"` at 800px width yields panels 1 and 2 of equal width side by side and panel 3 spanning the full inner width (assert computed rectangles).
- Composing a spec of solid-colour layers yields an image of expected total size where sampled pixels at known panel positions have the layer colours and the bubble area is white.
- Output lands at `07_final/strip.png`; export to `public/comics/` is refused while Stage 7 is not approved and succeeds after (assert files).

## Verification Plan
Run the Vitest suite for `tools/comic` and try the CLI command by hand on the sample data; expected results are described in the Testing Plan.
