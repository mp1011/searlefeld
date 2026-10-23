---
status: Done
---

# GOAL
Fill out the placeholder sections in the main agent_docs files in order to orient agents working on tasks.

Ensure that agents read only the relevant documents for the three major areas of this repository, depending on their task:

1. Characters, Story and Environment
2. Website
3. Image Creator

# Implementation Summary

- **`agent_docs/00_start_here.md`**:
  - Replaced the introductory `TODO(agent)` placeholder with a concise summary of Searlefeld and the purpose of the agent docs.
  - Updated the dev server placeholder in the Critical Rules to `cd website && npm run dev`.
  - Expanded the **Top-Level Repository Layout** to cover all three major project areas (`agent_docs/comic_notes/`, `website/`, and `tools/comic/` + `comic_assets/` + `comics_src/`) alongside `agent_docs/` and `scripts/`.
  - Added a **Repository Area Routing (Read Only What Applies to Your Task)** table explicitly instructing agents which documents to read—and which to skip—for each of the three major areas:
    1. **Characters, Story and Environment** (`agent_docs/comic_notes/README.md`, `characters/`, `situations/`, `reference_images/`)
    2. **Website** (`agent_docs/deep_dives/website_tech_stack.md`, `agent_docs/plans/initial_website/plan.md`)
    3. **Image Creator** (`agent_docs/deep_dives/comic_generation_stack.md`, `agent_docs/plans/image_generator/overall.md`)
  - Replaced the bottom `TODO(agent)` placeholder in **Task Quick Reference** with direct links to all three domain guides.
- **`agent_docs/01_overview.md`**:
  - Expanded the stub into a concise overview introducing Searlefeld and breaking down the three decoupled areas of the repository with links to each area's entry-point documentation.
- **`agent_docs/02_project_structure.md`**:
  - Added a structured **Major Areas & Directories** map covering Characters/Story/Environment, Website, Image Creator, and Agent Docs/Tooling above the machine-generated file listing block, and synced the generated listing with `scripts/work_dot_bat/update-project-structure.sh`.

# Verification
- Verified no `TODO(agent)` placeholders remain in `agent_docs/00_start_here.md`, `agent_docs/01_overview.md`, or `agent_docs/02_project_structure.md`.
- Verified `scripts/work_dot_bat/update-project-structure.sh --check`, `scripts/work_dot_bat/plan-status.sh check`, and `scripts/work_dot_bat/run-checks.sh` pass.
