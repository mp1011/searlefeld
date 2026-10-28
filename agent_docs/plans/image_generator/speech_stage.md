---
status: Done
subtask_of: plans/image_generator/overall.md
---

# Stage 6: Speech

## Goal
For each panel, Codex adds the characters' dialogue as speech bubbles onto the approved character image, saving `NN_background_character_speech.png`. The user reviews each one with the same continue / tweak / regenerate menu.

## Context
- Parent: `agent_docs/plans/image_generator/overall.md`, Stage 6. Depends on `character_generation_stage.md`.
- `overall.md` has Codex draw the speech. An earlier design rendered bubbles in code instead because AI text rendering is unreliable. Follow `overall.md`. The tweak and regenerate options are the fallback for misspelt text.

## Requirements
1. For each panel the tool runs Codex non-interactively with `NN_background_and_character.png`, each speaking character's name and exact dialogue in order, the instruction to draw speech bubbles pointing at the right speaker with the text spelled exactly as given, and the destination `NN_background_character_speech.png`.
2. A panel with no dialogue copies its character image unchanged with no Codex call.
3. The review prompt shows the expected dialogue for the panel next to the image path so the user can check spelling.
4. The shared review loop handles accept / tweak / edit-and-regenerate and resume; accepting every panel advances `status.json` to Stage 7.

## Implementation Plan
Pure prompt builder from the panel's characters; plug it into the shared review loop.

## Testing Plan
- Vitest: for a panel where Roko then Max speak, the prompt contains both lines verbatim in that order, each tied to its speaker, plus the source and destination paths.
- A panel whose characters all have empty `dialogue` copies the source image and makes no Codex call.
- The review prompt text for a panel includes its dialogue lines.
- Accepting every panel through the scripted loop moves `status.json` to Stage 7.

## Verification Plan
`scripts/work_dot_bat/run-checks.sh` passes. On a comic at Stage 6 the user generates and reviews each panel and the bubbles carry the script's dialogue.
