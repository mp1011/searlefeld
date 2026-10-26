# WELCOME TO THE searlefeld AGENT DOCS

Searlefeld is a webcomic about four AI thought experiments sharing an apartment, paired with an Astro static website and a stage-gated AI comic image creation pipeline. These docs orient AI coding agents so they read only the context needed for their specific task.

Agents: read the **Critical Rules** and the **Session Startup Protocol** below, then route your task through the **Area & Task Quick Reference** tables. Read the specialized guides and deep dives strictly on demand, never as onboarding.

> **CRITICAL RULES FOR ALL AI AGENTS**:
> 1. **Never start long-running servers.** Starting and managing the dev server (`cd website && npm run dev`) is **always the user's responsibility**.
> 2. **Never commit or push.** Git commits and pushes are made by the user, by hand.
> 3. **Keep plan status in sync.** Every plan file under `agent_docs/plans/` carries its status in a YAML frontmatter block (`---\nstatus: <value>\n---`) at the top. Always change it through `scripts/work_dot_bat/plan-status.sh` — never hand-edit a plan file's frontmatter block.
>    - Starting work on a plan: `scripts/work_dot_bat/plan-status.sh set <path> "In Progress"`.
>    - You believe the work is complete: `scripts/work_dot_bat/plan-status.sh set <path> "Ready for Review"` (never `"Done"` — only the user confirms that).
>    - The user agrees it is complete: `scripts/work_dot_bat/plan-status.sh set <path> "Done"`.
>    - Intentionally not finished, declined or abandoned: flag it to the user, who runs `scripts/work_dot_bat/plan-status.sh set <path> "Cancelled" --human`.
>    - Needs a human decision to proceed: `scripts/work_dot_bat/plan-status.sh set <path> "Blocked - User Input Required"`.
>    - Creating a new plan file under `agent_docs/plans/`: `scripts/work_dot_bat/plan-status.sh add <path>` (lands as `"Not Started"`). Start from `agent_docs/plan_template.md`.
>    - Untracked recommendations found in plan files: write each to `agent_docs/plans/agent_suggestions/<name>.md` and register it with `scripts/work_dot_bat/plan-status.sh add <path>`.

## Session Startup Protocol (Agents)

Start every session by reading **only**:

1. The **Critical Rules** above, plus the safety rules in `CLAUDE.md` / `GEMINI.md`.
2. [`01_overview.md`](01_overview.md) — what the project is, in a paragraph.
3. The **Area & Task Quick Reference** tables below — identify which of the three repository areas your task touches, read **only** the docs for that area plus your workflow instruction doc, and start.

### Top-Level Repository Layout

- `agent_docs/comic_notes/` - **Characters, Story & Environment**: character bios (`characters/`), scene scripts (`situations/`), and canonical visual references (`reference_images/`).
- `website/` - **Website**: Astro (TypeScript) static comic site; comic entries in `website/src/content/comics/`, strip images in `website/public/comics/`.
- `tools/comic/`, `comic_assets/`, `comics_src/` - **Image Creator**: 7-stage human-gated comic generation CLI, reference manifest, and per-strip workspaces.
- `agent_docs/` - Agent onboarding, workflow instructions (`instructions/`), architecture specs (`deep_dives/`), and plans (`plans/`).
- `scripts/` - Repo tooling and mechanical gates (`work_dot_bat`).

### Repository Area Routing (Read Only What Applies to Your Task)

Do **not** read docs from unrelated areas. Match your task to one of the three major areas below:

| Area | When Working On... | Read ONLY | Do NOT Read |
|---|---|---|---|
| **1. Characters, Story and Environment** | Writing/editing scripts, character bios, dialogue, or visual reference notes | `agent_docs/comic_notes/README.md`, relevant files in `agent_docs/comic_notes/characters/`, `agent_docs/comic_notes/situations/`, and `agent_docs/comic_notes/reference_images/` | Website (`website_tech_stack.md`) or Image Creator (`comic_generation_stack.md`) specs |
| **2. Website** | Astro pages, components, comic viewer/navigation, RSS, SEO, or Cloudflare deployment | `agent_docs/deep_dives/website_tech_stack.md` and `agent_docs/plans/initial_website/plan.md` (plus `agent_docs/comic_notes/README.md` only if writing cast/about copy or sample comics) | Image Creator pipeline specs (`comic_generation_stack.md`, `plans/image_generator/`) |
| **3. Image Creator** | 7-stage comic generation CLI, parsers, prompt assembly, AI image providers, speech bubbles, or panel/strip compositing | `agent_docs/deep_dives/comic_generation_stack.md` and `agent_docs/plans/image_generator/overall.md` (plus `agent_docs/comic_notes/` only when mapping character/room references or scene inputs) | Website architecture docs (`website_tech_stack.md`, `plans/initial_website/`) |

### Task Quick Reference

| Task | Read |
|---|---|
| Generate or edit any image (panels, backgrounds, characters, props, banners, references) | `agent_docs/03_image_gen.md` first, then the relevant visual references and character/scene notes it routes to |
| Small change or bug fix | `agent_docs/instructions/low_trust/do-work.md` (interactive) or `high_trust/do-work-yolo.md` (unattended) |
| Break a large task into subtasks | `agent_docs/instructions/high_trust/task-breakdown.md` |
| Work the next subtask of a plan | `agent_docs/instructions/high_trust/next-subtask-yolo.md` |
| Order subtasks for a parent plan | `agent_docs/instructions/high_trust/plan-order.md` |
| Break up an oversized file | `agent_docs/instructions/high_trust/monolith-breakup.md` |
| A behavior is hard to test | `agent_docs/instructions/testability_escalation.md` |
| Before pushing | `agent_docs/instructions/low_trust/prepare-for-push.md` |
| Assess whether a plan is really done | `agent_docs/instructions/high_trust/assess-done.md` |
| Project health review | `agent_docs/instructions/high_trust/project-health-assessment.md` |
| Where is a file / what does it do? | `agent_docs/02_project_structure.md` |
| Characters, story & environment notes | `agent_docs/comic_notes/README.md` (`characters/`, `situations/`, `reference_images/`) |
| Website architecture & tech stack | `agent_docs/deep_dives/website_tech_stack.md` |
| Image Creator pipeline & tech stack | `agent_docs/deep_dives/comic_generation_stack.md` and `agent_docs/plans/image_generator/overall.md` |

## How to run things

- Install: `cd website && npm install`
- Dev server (user only): `cd website && npm run dev`
- Build and static checks: `cd website && npm run build` and `npm run check`
- Light tests: `cd website && npm test` (Vitest; includes a build test)
- Heavy tests: (none configured)
- Mechanical gate (what the pre-push hook and CI run): `scripts/work_dot_bat/run-checks.sh`
