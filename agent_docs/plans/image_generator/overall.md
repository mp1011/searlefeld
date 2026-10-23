---
status: Ready for Review
---

# PLAN

Design the overall plan for the image editor and create documentation to be used by the other tasks in this folder.


# Primary Goal
This tool allows the human and agent to work together to create comic images. Rather than create the image at once, we can tweak it one part at a time.

# Input
User will provide a scene definition MD file, containing the location, characters, and dialogue. This is not a strict formatted file, its meant for the LLM to interpret.


# Specific Parts
The image is build in the following stages. Each stage has a hard human-gate before continuing to the next.
1. Layout  
2. Camera Angles
3. Backgrounds
4. Character Descriptions
5. Character Images
6. Dialogue
7. Final touches


## Layout
- overall width of the comic is fixed to a mobile-friendly size
- this describes the general layout, however the agent may make some panels slightly larger or smaller to improve the presentation
- layout format is expressed like so:

Four equal panels:
12
34

Two panels in the top row, third panel takes up the entire second row
12
3

Three panels in one row
123

## Camera Angles
We don't mean exact points in 3d space. Think more like "wide shot of couch" or "facing entrance"

Example format:
1. Medium shot of front door
2. Medium shot of couch, facing window
3. Slight pan in of #1
4. Wide shot of living room, facing couch with Chinese Room in frame

## Backgrounds
The agent generates the background images of each panel, rendering them a dedicated folder for the human's review

## Character Descriptions
The agent describes the characters and poses in each shot.
Use an indented format to describe each panel, character, and pose

Example Format:
```
Panel 1
    Roko
        Entering
        Mentally exhausted
    Max
        Sitting on couch
        Casual
Panel 2
    Roko
        Sitting on couch
        shoulder slumped, head down
    Max
        Sitting on couch
        cheerful
```

## Character Images
Based on the descriptions in the last stage, the AI generates one image per panel with the characters. 
The images only contain the characters with a transparent background, meant to be superimposed over the background image in a later phase

Same human review process as background images

## Dialogue
Dialogue bubbles and text are generated programatically rather than by the LLM

Same human review progrses as background and character images

## Final Touches
The entire comic is composited together into a single images. The agent can suggest further improvements to the final images for the best visual presentation.

---

# Architecture & Documentation Reference

Full technical specification and workflow reference: [`agent_docs/deep_dives/comic_generation_stack.md`](../../deep_dives/comic_generation_stack.md).

## Workspace & Stage Gate Contract

Each comic strip is built in a dedicated workspace directory under `comics_src/<NNNN-slug>/`. Every stage reads the approved outputs of previous stages, writes its artifacts to a predictable path/folder, and pauses at a **hard human gate** tracked in `comics_src/<NNNN-slug>/strip.json` (`pending_review` -> `approved`).

| Stage | Artifact Path in `comics_src/<NNNN-slug>/` | Format / Output | Human Gate Action |
|---|---|---|---|
| **Input** | `scene.md` (or path in `agent_docs/comic_notes/situations/*.md`) | Loose Markdown with location, characters, and dialogue | Human provides input file |
| **1. Layout** | `01_layout.md` | Compact digit grid (`12\n34`, `12\n3`, `123`) at fixed mobile width (`800px` default) + optional panel size weights | Human edits/approves `01_layout.md` |
| **2. Camera Angles** | `02_camera_angles.md` | Numbered list (`1. Medium shot of front door`, `3. Slight pan in of #1`) mapped to room reference angles | Human edits/approves `02_camera_angles.md` |
| **3. Backgrounds** | `03_backgrounds/panel-<N>.png` (+ `.meta.json`) | Empty background image per panel (no foreground characters or text) | Human reviews folder, regenerates/imports if needed, approves stage |
| **4. Character Descriptions** | `04_character_descriptions.md` | 4-space indented outline (`Panel N` -> `Character` -> `Pose / Expression`) | Human edits/approves `04_character_descriptions.md` |
| **5. Character Images** | `05_character_images/panel-<N>.png` (+ `.preview.png`, `.meta.json`) | One RGBA PNG per panel containing only the panel's characters on a transparent background (plus preview over Stage 3 background) | Human reviews folder, regenerates/imports if needed, approves stage |
| **6. Dialogue** | `06_dialogue/panel-<N>.png` (+ `.svg`, `.preview.png`) | Programmatically generated speech/thought bubbles and tails on a transparent layer (plus preview over Stage 3 + 5) | Human reviews folder, tweaks text/anchors if needed, approves stage |
| **7. Final Touches** | `07_final/strip.png` & `07_final/review_notes.md` | Full composited strip + agent visual review suggestions; exports to `public/comics/<NNNN-slug>.png` upon approval | Human reviews composite & suggestions, applies tweaks or approves final export |

## Specification Details for Shared Formats

1. **Stage 1 Layout Parser (`01_layout.md`)**:
   - Each non-empty line in the layout block represents one horizontal row of panels.
   - Each digit `1`–`9` represents a panel ID in reading order.
   - All panels in a row share the fixed strip inner width (`800px` minus outer borders and gutters) equally by default, or proportionally when optional column width weights / row heights are specified by the agent to improve presentation.
2. **Stage 2 Camera Angle Parser (`02_camera_angles.md`)**:
   - Matches `^(\d+)\.\s+(.+)$` per line, validating that panel numbers `1..N` match the panels declared in Stage 1.
   - Detects relative references (e.g., `Slight pan in of #1` or `#1`) so Stage 3 can attach or crop panel 1's approved background.
3. **Stage 4 Character Description Parser (`04_character_descriptions.md`)**:
   - Level 0 (`^Panel\s+(\d+)\s*$`): selects panel `N`.
   - Level 1 (`^    ([A-Za-z0-9 _-]+)\s*$`): selects a character in panel `N` and resolves their visual description and turnaround sheet from `comic_assets/references/manifest.json` (and `agent_docs/comic_notes/characters/`).
   - Level 2 (`^        (.+)\s*$`): appends pose, blocking, and expression descriptors for that character in panel `N`.
4. **Stage 5 Transparent Character Layer (`05_character_images/`)**:
   - Produces a single composite character layer image per panel (`panel-<N>.png`) with an alpha channel (`RGBA`), containing all characters in that panel posed according to Stage 4 and framed to match Stage 2.
   - Includes automated background removal / chroma-to-alpha conversion when the AI image provider returns a solid background, plus `panel-<N>.preview.png` composited over `03_backgrounds/panel-<N>.png` for immediate human visual checking.
5. **Stage 6 Programmatic Dialogue (`06_dialogue/`)**:
   - Never uses the LLM image generator for text. Renders crisp SVG speech/thought balloons with word wrapping and directional or off-panel tails, rasterized to transparent PNGs via `sharp`.
6. **Hard Gate Enforcement (`strip.json`)**:
   - CLI tools refuse to run Stage `K` unless Stage `K-1` has status `approved` in `strip.json`, preventing accidental unreviewed progression.

## Tasks in This Folder

1. [`build_reference_library_and_prompt_assistant.md`](build_reference_library_and_prompt_assistant.md) — Reference manifest (`comic_assets/references/manifest.json`), parsers for Stages 1 (`01_layout.md`), 2 (`02_camera_angles.md`), and 4 (`04_character_descriptions.md`), stage-gate state management, and prompt draft assembly for Stages 3 and 5.
2. [`build_image_generation_command.md`](build_image_generation_command.md) — `ImageProvider` (`@google/genai` + manual import), Stage 3 background generation into `03_backgrounds/`, and Stage 5 per-panel transparent character image generation (with alpha cutout and background preview) into `05_character_images/`.
3. [`build_speech_bubble_renderer.md`](build_speech_bubble_renderer.md) — Stage 6 programmatic SVG/PNG speech and thought bubble layout, word wrapping, speaker/off-panel tails, and `06_dialogue/` preview rendering.
4. [`build_panel_and_strip_compositor.md`](build_panel_and_strip_compositor.md) — Stage 1 fixed-width mobile layout geometry calculator, per-panel layer compositor, Stage 7 full-strip composition into `07_final/strip.png`, and final export to `public/comics/`.

## Verification Plan

- Confirm `agent_docs/deep_dives/comic_generation_stack.md` documents all 7 stages, their input/output file formats, review folders, and hard human gates.
- Confirm all four task plans in `agent_docs/plans/image_generator/` reference this plan and `agent_docs/deep_dives/comic_generation_stack.md` and align with the 7-stage design.
- Run `scripts/work_dot_bat/plan-status.sh check` and `scripts/work_dot_bat/update-project-structure.sh --check` to verify repository documentation integrity.
