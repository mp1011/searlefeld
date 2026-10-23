---
status: Not Started
subtask_of: plans/decide_comic_generation_stack.md
---

# Build Reference Library and Prompt Assistant

## Goal
Start a strip workspace from a scene file, see which stage it is at, approve stages, and run `comic prompt` to get editable draft prompts (plus the reference images to attach) for Stage 3 backgrounds and Stage 5 character images.

## Context
Pipeline design (7 human-gated stages, workspace layout, file formats): `agent_docs/plans/image_generator/overall.md` and `agent_docs/deep_dives/comic_generation_stack.md`.
Character notes are in `agent_docs/comic_notes/characters/`. Reference images already exist in `agent_docs/comic_notes/reference_images/` (character turnarounds, workshop-loft angles); the manifest should index them rather than add placeholders.
Parent decision: `agent_docs/plans/decide_comic_generation_stack.md`.

## Requirements
1. `comic_assets/references/manifest.json` (tags, description, default attachments per character and per location/angle) pointing at the existing reference images.
2. Parsers for `01_layout.md` (digit grid), `02_camera_angles.md` (numbered shots, `#N` references) and `04_character_descriptions.md` (4-space indented Panel → Character → pose lines), with clear errors naming the bad line.
3. `strip.json` stage-gate state: `comic init <scene.md>`, `comic status`, `comic approve <stage>`; a stage cannot run until the previous stage is `approved`.
4. `comic prompt <strip> --stage 3|5 [--panel N]` writes one draft prompt per panel to a file and prints it. Stage 3 prompts exclude characters and text; Stage 5 prompts ask for characters only on a plain background.
5. Nothing is sent to any API by these commands.

## Implementation Plan
Create the manifest, the three parsers, gate state handling, prompt templates for background and character layers, and the CLI commands. Parsing and prompt assembly are pure functions.

## Testing Plan
- Layout parser: `"12\n3"` returns two rows, panel 3 spanning row 2; a non-digit character yields an error naming the line (assert returned structure / thrown message).
- Camera angle parser: `"3. Slight pan in of #1"` returns panel 3 with a reference to panel 1; a panel number not in the layout yields a clear error.
- Character description parser: the example outline in `overall.md` returns panel 1 with Roko [Entering, Mentally exhausted] and Max [Sitting on couch, Casual] (assert object); a mis-indented line yields an error naming the line.
- Given a manifest and panel 1 with characters [roko, max] and a workshop-loft entrance shot, the Stage 5 draft prompt includes both character descriptions and the pose lines, and lists exactly those characters' reference paths; the Stage 3 draft lists the location reference and no character references (assert returned object).
- Gate: `comic prompt --stage 5` on a workspace whose Stage 4 is `pending_review` exits with an error and writes nothing (assert exit code and temp dir contents).
- CLI run on a sample workspace writes the draft files (assert files exist in temp dir and contents match the function output).

## Verification Plan
Run the Vitest suite for `tools/comic` and try the CLI command by hand on the sample data; expected results are described in the Testing Plan.
