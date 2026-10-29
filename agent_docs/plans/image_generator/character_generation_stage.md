---
status: Done
subtask_of: plans/image_generator/overall.md
---

# Stage 5: Character Generation

## Goal
For each panel, Codex adds the panel's characters (no speech) onto its approved background, saving `NN_background_and_character.png`. The user reviews each image with the same continue / tweak / regenerate menu as backgrounds.

## Context
- Parent: `agent_docs/plans/image_generator/overall.md`, Stage 5. Depends on `background_generation_stage.md` (shared review loop, pixel size, verified Codex image call).
- For character generation, follow [the current image guide](../../03_image_gen.md#character-references): inspect and pass each visible character's appropriate turnaround, facial-expression sheet and shared height reference, plus the relevant bio summary. Use Ailan's intact-human turnaround by default and his exposed-robot sheet when the scene calls for machinery. Chinese Room uses the eight-mood dot-matrix monitor sheet. Resolve current per-character paths from the guide rather than historical flat filenames. Characters with no reference are described from text only.
- Map names to references in one small table that is easy to extend, not in the prompt code.

## Requirements
1. For each panel the tool runs Codex non-interactively with the panel's `NN_background.png`, each character's action and mood, the character reference images, the instruction to include no speech or text, and the destination path `NN_background_and_character.png`.
2. A panel with no characters copies its background unchanged with no Codex call.
3. The shared review loop from Stage 4 handles accept / tweak / edit-and-regenerate and resume per panel.
4. When every panel is accepted, `status.json` advances to Stage 6.

## Implementation Plan
Pure prompt builder from a panel and the character reference table; plug it into the shared review loop.

## Testing Plan
- Vitest: for a panel with Roko and Max, the prompt names the background path, both characters' action and mood, both turnaround image paths, the no-speech instruction and the destination; it contains no dialogue text.
- A character name that isn't in the table yields a prompt with the text description and no reference path.
- A panel with an empty `characters` array produces a copy of the background and no Codex call.
- Accepting every panel through the scripted review loop moves `status.json` to Stage 6.

## Verification Plan
`scripts/work_dot_bat/run-checks.sh` passes. On a comic at Stage 5 the user generates and reviews every character panel and sees recognisable cast members on the approved backgrounds.
