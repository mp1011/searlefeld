---
status: Done
subtask_of: plans/image_generator/overall.md
---

# Stage 7: Final Stitch and Approval

## Goal
The tool stitches the approved speech panels into one `comic_full.png` laid out by each panel's row, column, width and height, then asks the user to accept it or tweak it through an interactive Codex image edit. Accepting marks the comic complete.

## Context
- Parent: `agent_docs/plans/image_generator/overall.md`, Stage 7. Depends on `speech_stage.md` and the total comic size chosen in `background_generation_stage.md`.
- Stitching is done in code with `sharp`, not by Codex. Generated panels may not match their target pixel size exactly; resize each to its slot instead of failing.
- Gutters/borders between panels aren't specified in `overall.md`. Use a small fixed gutter, defined as one constant next to the total comic size.
- Copying the result into the website (`website/public/comics/`) isn't part of `overall.md` and is out of scope.

## Requirements
1. The tool composites every `NN_background_character_speech.png` into `comic_full.png` in the comic folder, placing each panel by its row, column, width and height.
2. It prints the path and asks whether to accept the final image. "No" opens an interactive Codex session to edit `comic_full.png` with the requested changes, then asks again. Keep the previous image (for example `comic_full.prev.png`) so a bad edit can be undone.
3. "Yes" marks the comic complete in `status.json`. Running the CLI on a completed comic says so and offers to re-stitch.
4. A missing panel image is reported by name and the comic stays at Stage 7.

## Implementation Plan
A pure layout function (panels + total size → pixel rectangles), then a `sharp` compositor that uses it.

## Testing Plan
- Vitest: layout for a 2×2 grid of 50%×50% panels yields four non-overlapping rectangles covering the area minus gutters; a full-width bottom panel spans both columns.
- Compositor with solid-colour fixture panels: the output has the expected size, and sampling the centre of each slot returns that panel's colour.
- A fixture panel of the wrong size is resized into its slot, not rejected.
- Missing `02_background_character_speech.png` gives an error naming that file and no output image.
- Scripted "Yes" sets the completed state; scripted "No" calls the interactive launcher once and keeps the previous image.

## Verification Plan
`scripts/work_dot_bat/run-checks.sh` passes. On a comic at Stage 7 the user opens `comic_full.png`, sees the panels in reading order, accepts it, and rerunning the CLI reports the comic as complete.
