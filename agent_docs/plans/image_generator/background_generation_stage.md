---
status: Ready for Review
subtask_of: plans/image_generator/overall.md
---

# Stage 4: Background Generation

## Goal
The tool makes one background image per panel (`00_background.png`, `01_background.png`, ...), one at a time, and asks the user after each one whether to continue, tweak the image through an interactive Codex session, or edit `panels.json` and regenerate.

## Context
- Parent: `agent_docs/plans/image_generator/overall.md`, Stage 4. Depends on `panel_review_stage.md`.
- The per-panel review loop built here (continue / tweak interactively / edit `panels.json` and regenerate) is reused by Stages 5 and 6 — build it as a shared component.
- **Pixel size**: `overall.md` gives panel `width`/`height` as percentages of the comic area but sets no total size. An earlier design used an 800px mobile-friendly width. Pick a fixed total size, define it as one constant in code, and derive each panel's pixel size from it.
- **Unverified**: whether `codex exec` can generate an image and save it to a given path non-interactively. Check this first. If it can't, set this plan to `Blocked - User Input Required` and describe what you found, rather than switching image provider (`overall.md` says the tool only uses Codex).
- Three cases from `overall.md`: reference only → copy the reference image unchanged (no Codex); reference + description → Codex with the reference; description only → Codex from text.

## Requirements
1. For each panel in order, the tool produces `NN_background.png` (0-based, two digits) in the comic folder using the three cases above and the prompts in `overall.md`, with the pixel size computed from the panel.
2. After each image, the tool prints its path and asks "Continue? (y/n)". `y` moves to the next panel. `n` offers: 1) tweak the image with an interactive Codex session, then ask again; 2) edit `panels.json`, confirm, then regenerate this panel and ask again.
3. Progress per panel is stored in `status.json`. Quitting and rerunning resumes at the first unaccepted panel without regenerating accepted ones.
4. When every panel is accepted, `status.json` advances to Stage 5.
5. A Codex run that exits without writing the expected file is reported and the user can retry or quit.

## Implementation Plan
Pure functions for the case selection, prompt text and pixel size; a shared `reviewPanels(stage, panels, generateOne)` loop that owns the menu and per-panel progress.

## Testing Plan
- Vitest: a panel with only a reference produces a byte-identical copy and makes no Codex call; reference + description and description-only produce prompts that contain the size, the reference path (first case only), the description and the destination path.
- Pixel size: a 50%×50% panel on the chosen total size yields the expected width and height.
- Review loop with scripted answers `y, n→1, y, y` over three panels and a stub generator: the interactive launcher is called once for panel 1, every panel ends accepted, the stage moves to 5.
- Resume: `status.json` with panels 0 and 1 accepted starts generation at panel 2.
- A stub Codex that writes no file yields the retry/quit prompt, not an advance.

## Verification Plan
`scripts/work_dot_bat/run-checks.sh` passes. On a reviewed comic the user generates all backgrounds, rejects and tweaks at least one, quits midway and resumes, and opens the resulting `NN_background.png` files.
