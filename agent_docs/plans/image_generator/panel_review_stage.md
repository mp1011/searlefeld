---
status: Not Started
subtask_of: plans/image_generator/overall.md
---

# Stage 3: Panel Review

## Goal
The user reviews the filled `panels.json` from a menu: they can edit it by hand, open an interactive Codex session to change it, or approve it and move on to background generation.

## Context
- Parent: `agent_docs/plans/image_generator/overall.md`, Stage 3. Depends on `panel_descriptions_stage.md` and the Codex launcher and validator from `scaffold_cli_and_new_comic.md`.

## Requirements
1. The Stage 3 menu shows a readable summary of `panels.json` (title, and per panel: position/size, background reference or description, each character's action, mood and dialogue) and the file path.
2. Menu options: "I edited the file, re-check" (re-validate and show the summary again), "Edit panels.json interactively" (interactive Codex with the prompt from `overall.md`, then return to the menu), "Approve", and "Quit" (keeps Stage 3).
3. "Approve" runs the validator first. An invalid file can't be approved; the menu shows the errors and stays at Stage 3.
4. A valid approval advances `status.json` to Stage 4.

## Implementation Plan
Keep the summary formatter a pure function of the parsed panels; the menu loop takes the input source, Codex launcher and validator as dependencies so it runs in tests.

## Testing Plan
- Vitest: the summary formatter, given a fixture `panels.json`, outputs each panel's background and every character's dialogue line.
- Menu loop with scripted input "Approve" on a valid file: `status.json` moves to Stage 4.
- Scripted "Approve" on an invalid file: errors are printed and the stage stays at 3.
- Scripted "Edit interactively" then "Approve": the stub launcher is called once in interactive mode with a prompt naming the `panels.json` path, then the stage moves to 4.

## Verification Plan
`scripts/work_dot_bat/run-checks.sh` passes. On a comic at Stage 3 the user sees the summary, makes an edit through the interactive option, approves, and the tool reports Stage 4.
