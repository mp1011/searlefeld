---
status: Done
subtask_of: plans/image_generator/overall.md
---

# Comic CLI Skeleton and Stage 1 Scaffolding

## Goal
The user runs one command with a path to a situation file and gets a new numbered comic folder in `comic_src/` holding a `status.json` and an empty `panels.json` template. Running the CLI again on that folder shows which stage the comic is at and offers that stage's menu, so later stages plug in.

## Context
- Parent: `agent_docs/plans/image_generator/overall.md` (Stage 1 and the `panels.json format` section). Nothing of the tool exists yet; `tools/`, `comic_assets/` and `comics_src/` are absent and `comic_src/` is empty.
- Stack (from `agent_docs/plans/decide_comic_generation_stack.md`): TypeScript on Node 22, run with `tsx`, tested with Vitest; `sharp` for image work in later stages. The old pipeline deep dive was deleted as out of date and will be recreated later — don't write a new one in this subtask.
- Root `package.json` only holds `typescript`; the website has its own `package.json`. Put the CLI under `tools/comic/` with its dependencies and a `comic` script at the root, and make sure its tests run in `scripts/work_dot_bat/run-checks.sh`.
- The folder name is `NNN_<source basename>` (for example `000_nvidia` from `situations/nvidia.md`): a 3-digit counter, one higher than the largest existing prefix in `comic_src/`.

## Requirements
1. `npm run comic -- new <path to situations/*.md>` creates `comic_src/NNN_<basename>/` and prints its path. A missing source file, or one outside `agent_docs/comic_notes/situations/`, is rejected with a clear message and nothing is created.
2. `panels.json` follows the `overall.md` format: `source` (repo-relative path to the md file) and `title` fields, and four panel entries, each with two empty character entries. Every field is present with empty values; no comic content is filled in.
3. `status.json` records the current stage (Stage 2 next, after scaffolding) and a list of completed stages.
4. `npm run comic -- <comic folder>` (and a no-argument form that lists the comics in `comic_src/` to pick from) reads `status.json` and dispatches to the current stage's handler. Stages not built yet print "not implemented yet" and exit cleanly.
5. A shared `panels.json` loader/validator reports JSON syntax errors and schema errors (missing fields, wrong types, row/column/size out of range) with readable messages. Later stages reuse it.
6. A shared helper launches Codex: non-interactive (`codex exec` with a prompt, wait for exit, capture the result) and interactive (hand over the terminal until the user exits, then resume the menu). Prompts are built in code and logged to the comic folder so a run can be retraced.

## Implementation Plan
- `tools/comic/cli.ts` entry point; one module per stage behind a common interface (`run(comicDir, status)` returning the next stage); `status.ts`, `panels.ts` (types + validator), `codex.ts` (process launcher behind an interface so tests can stub it), and a small menu/prompt helper.
- Write files atomically so an interrupted run never leaves half-written JSON.

## Testing Plan
- Vitest, against a temporary directory: running `new` with a situation file twice produces `000_<name>` then `001_<name>`; the folders contain parseable `status.json` and `panels.json` with four panels of two characters each and the source path recorded.
- `new` with a missing file, or a file outside `situations/`, exits non-zero and leaves the temp `comic_src/` unchanged.
- The validator returns no errors for the scaffolded template, a syntax error with a line/position for broken JSON, and a named-field error for a panel missing `characters`.
- Dispatch: a folder whose `status.json` says Stage 3 calls the Stage 3 handler (stubbed) and not others.
- The Codex launcher, given a stub executable, passes the prompt through and reports its exit code.

## Verification Plan
`scripts/work_dot_bat/run-checks.sh` passes. Running `npm run comic -- new agent_docs/comic_notes/situations/nvidia.md` creates `comic_src/000_nvidia/` with both files; running `npm run comic -- comic_src/000_nvidia` reports Stage 2. Delete the test folder afterwards.
