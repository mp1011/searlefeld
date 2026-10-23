---
status: Not Started
subtask_of: plans/decide_comic_generation_stack.md
---

# Build Image Generation Command

## Goal
Run `comic generate` for Stage 3 (backgrounds) or Stage 5 (character images) with human-approved prompts and their reference images, and get per-panel images in the stage's review folder; or import an externally made image.

## Context
Depends on the prompt assistant (drafts, parsers, gate state). API key from `GEMINI_API_KEY`, never committed.
Pipeline design: `agent_docs/plans/image_generator/overall.md` and `agent_docs/deep_dives/comic_generation_stack.md`. Parent decision: `agent_docs/plans/decide_comic_generation_stack.md`.

## Requirements
1. `ImageProvider` interface with Gemini implementation and manual-import implementation.
2. `comic generate` asks for confirmation before sending, and refuses to run if the previous stage is not `approved`.
3. Stage 3 writes `comics_src/<slug>/03_backgrounds/panel-<N>.png`; Stage 5 writes `05_character_images/panel-<N>.png`. Each has a `.meta.json` sidecar (prompt, refs, provider, time). Regenerating one panel leaves the others untouched.
4. Stage 5 output is RGBA with a transparent background (solid/chroma background converted to alpha when the provider returns one), plus `panel-<N>.preview.png` over the Stage 3 background.
5. Missing API key gives a clear error.

## Implementation Plan
Implement the interface, the Gemini provider via `@google/genai`, import command, and CLI.

## Testing Plan
- With a fake provider returning a known PNG, `generate --stage 3 --panel 2` writes `03_backgrounds/panel-2.png` and a sidecar whose prompt and refs equal the input, and leaves existing `panel-1.png` byte-identical (assert files).
- With a fake provider returning a character on solid green, Stage 5 output has an alpha channel and a sampled corner pixel is fully transparent while a sampled character pixel is opaque (sample with sharp).
- Declining confirmation, or running Stage 5 while Stage 4 is not approved, sends nothing (fake provider call count is 0).
- Missing env var produces the expected error text.
- Manual import copies a file into the stage folder and writes a sidecar.

## Verification Plan
Run the Vitest suite for `tools/comic` and try the CLI command by hand on the sample data; expected results are described in the Testing Plan.
