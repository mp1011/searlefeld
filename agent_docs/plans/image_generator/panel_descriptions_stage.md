---
status: Ready for Review
subtask_of: plans/image_generator/overall.md
---

# Stage 2: Panel Descriptions via Codex

## Goal
After scaffolding, the user continues the comic and Codex fills `panels.json` from the situation file: panel count, layout, backgrounds, characters and dialogue. If Codex writes invalid JSON, the tool asks it to fix the file, up to 3 times, before handing the problem to the user.

## Context
- Parent: `agent_docs/plans/image_generator/overall.md`, Stage 2. Depends on `scaffold_cli_and_new_comic.md` (CLI dispatch, `panels.json` validator, Codex launcher).
- The prompt in `overall.md` is the starting point. Codex needs more to fill the file well: the list of cast names (`agent_docs/comic_notes/characters/`) and the available background references (`agent_docs/comic_notes/reference_images/location/`), so `background.reference` points at real files.
- `width`/`height` are percentages of the comic area and `row`/`column` place the panel. Tell Codex the rules (panels in a row fill 100% of the width, etc.) so Stage 7 can stitch the result.

## Requirements
1. From Stage 2, the tool runs Codex non-interactively with a prompt naming the `panels.json` path, the source md, the cast list, the reference image folder and the layout rules.
2. When Codex exits, the tool validates `panels.json` (syntax and schema). On failure it runs Codex again non-interactively with the validator's error messages, up to 3 retries.
3. After 3 failed retries, the tool stops, prints the remaining errors and the file path, and on the next run offers: retry Codex, or "I fixed it by hand" (re-validate).
4. A valid file advances `status.json` to Stage 3 and prints a short summary (panel count, characters per panel).
5. Layout errors (overlapping panels, a row whose widths don't sum to 100%) and `background.reference` paths that don't exist are reported as validation errors.

## Implementation Plan
Prompt builder as a pure function (inputs: paths, cast list, reference list); the retry loop takes the Codex launcher and validator as dependencies.

## Testing Plan
- Vitest with a stubbed Codex launcher that writes a fixed `panels.json`: valid output advances `status.json` to Stage 3 after one call.
- Stub writes broken JSON on the first two calls and valid JSON on the third: three calls, the second and third prompts contain the previous errors, stage advances.
- Stub always writes broken JSON: exactly 4 calls (1 + 3 retries), stage stays at 2, the printed output names the file and the errors.
- Validator: panels in a row with widths summing to 120% and a nonexistent reference path each give a named error.
- Prompt builder output contains the cast names and every reference image path found in the fixture folder.

## Verification Plan
`scripts/work_dot_bat/run-checks.sh` passes. On a scaffolded `nvidia` comic, the user runs the CLI, Codex fills `panels.json`, and the tool reports Stage 3 with a summary that matches the script.
