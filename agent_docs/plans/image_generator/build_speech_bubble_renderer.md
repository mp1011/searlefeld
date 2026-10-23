---
status: Not Started
subtask_of: plans/decide_comic_generation_stack.md
---

# Build Speech Bubble Renderer

## Goal
Given dialogue text and an anchor point, produce a speech-bubble image with wrapped text and a tail pointing at the speaker.

## Context
Pure layout code, independent of image generation. This is Stage 6 (Dialogue) of the pipeline: text is never baked into AI images.
Pipeline design: `agent_docs/plans/image_generator/overall.md` and `agent_docs/deep_dives/comic_generation_stack.md`. Parent decision: `agent_docs/plans/decide_comic_generation_stack.md`.

## Requirements
1. Text wrapping to a max width using a bundled font.
2. Bubble sized to text; tail points toward a given anchor.
3. Output as SVG and rasterized PNG with transparency.
4. Support speech and thought styles, plus an off-panel tail that points to a panel edge (unseen speaker).
5. Per-panel output written to `comics_src/<slug>/06_dialogue/panel-<N>.svg` / `.png`, plus `panel-<N>.preview.png` over the Stage 3 and Stage 5 layers for human review.

## Implementation Plan
Implement wrap and geometry as pure functions, then an SVG renderer and `sharp` rasterization.

## Testing Plan
- Wrapping a known sentence at a given width yields expected lines (assert array).
- Bubble rect contains all text lines; tail tip equals the anchor (assert geometry numbers).
- Rasterized PNG has expected dimensions and transparent corner pixel (sample with sharp).

## Verification Plan
Run the Vitest suite for `tools/comic` and try the CLI command by hand on the sample data; expected results are described in the Testing Plan.
