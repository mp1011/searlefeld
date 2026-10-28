---
status: Done
plan_order:
  - plans/image_generator/build_reference_library_and_prompt_assistant.md
  - plans/image_generator/build_image_generation_command.md
  - plans/image_generator/build_speech_bubble_renderer.md
  - plans/image_generator/build_panel_and_strip_compositor.md
---

# GOAL
Create tools to help with creation of comics, using AI generated images.

# Specifications
- Individually generate character and backgrounds for each panel.
- Programatically generate speech bubbles
- Human will control image prompting but tool can assist with forming the prompts themselves
- image prompts will be based on having references images in this repository

# Decision Summary
Full evaluation: `agent_docs/deep_dives/comic_generation_stack.md`.
- **Runtime**: TypeScript on Node 22, shared toolchain with the Astro site; CLI under `tools/comic/`.
- **Image generation**: pluggable `ImageProvider`; default Google Gemini image model via `@google/genai`; manual-import fallback. Characters and backgrounds generated as separate layers per panel.
- **Prompting**: human-edited; tool assembles drafts from templates plus a reference-image manifest in `comic_assets/references/`.
- **Speech bubbles**: generated in code as SVG, rasterized/composited with `sharp`; never baked into AI images.
- **Strip spec**: `comics_src/<NNNN-slug>/strip.json` drives reproducible composition, exported to `public/comics/`.
- **Testing**: Vitest for prompt assembly, bubble layout, spec validation, compositing output.

# Follow-up Implementation Plans
1. `agent_docs/plans/image_generator/build_reference_library_and_prompt_assistant.md`
2. `agent_docs/plans/image_generator/build_image_generation_command.md`
3. `agent_docs/plans/image_generator/build_speech_bubble_renderer.md`
4. `agent_docs/plans/image_generator/build_panel_and_strip_compositor.md`
