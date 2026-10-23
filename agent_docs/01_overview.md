# OVERVIEW

**Searlefeld** is a webcomic about four AI thought experiments—Roko (Roko's Basilisk), Max (the Paperclip Maximizer), Ailan (a Turing-test bot), and Chinese Room (a guy in a room with a symbol book)—living together like a sitcom cast in a New York-style apartment.

The repository is split into three distinct, decoupled areas. Agents should read **only** the documentation for the area their task touches:

1. **Characters, Story and Environment** (`agent_docs/comic_notes/`): The creative source of truth—character personalities and visual designs (`characters/`), loose scene scripts (`situations/`), and canonical turnaround/apartment reference sheets (`reference_images/`). Start at [`agent_docs/comic_notes/README.md`](comic_notes/README.md).
2. **Website** (`website/`): A zero-backend Astro + TypeScript static site that displays comic strips (`website/public/comics/`), Markdown transcripts/metadata (`website/src/content/comics/`), archive/cast pages, and an RSS feed, deployed to Cloudflare Pages. Read [`agent_docs/deep_dives/website_tech_stack.md`](deep_dives/website_tech_stack.md).
3. **Image Creator** (`tools/comic/`, `comic_assets/`, `comics_src/`): A 7-stage, human-gated TypeScript CLI pipeline that turns a scene script into a finished strip—progressing through Layout (`01_layout.md`), Camera Angles (`02_camera_angles.md`), AI Backgrounds (`03_backgrounds/`), Character Descriptions (`04_character_descriptions.md`), transparent AI Character Images (`05_character_images/`), programmatic SVG/PNG Dialogue (`06_dialogue/`), and Final Touches (`07_final/`). Read [`agent_docs/deep_dives/comic_generation_stack.md`](deep_dives/comic_generation_stack.md) and [`agent_docs/plans/image_generator/overall.md`](plans/image_generator/overall.md).
