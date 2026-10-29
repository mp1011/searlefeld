---
status: Ready for Review
verification: manual
---

# GOAL 
Misc updates to the references images

1. Ailan needs two sets of reference images, one in his full human getup, and one with his robot parts fully showing.
2. Give each character a "facial expressions" reference images showing different moods

## Research and scope

- Current character references live in per-character folders, while the image routing guide still lists older flat paths.
- Ailan's existing sheet shows clothing cutaways. Preserve it as a historical mechanical-design reference; add separate intact human-presentation and fully exposed robot turnarounds.
- Chinese Room already has three expressions; expand to a consistent eight-mood sheet. He remains a wall monitor with a dot-matrix face and no body.
- Preserve the approved character designs, warm inked comic style and numerical scale defaults.

## Implementation and verification plan

- [x] Read relevant image guidance, bios and inspect all current character and scale references.
- [x] Generate two Ailan turnarounds and four eight-mood expression sheets with the built-in image tool.
- [x] Inspect identity, clothing/mechanical visibility, mood distinctions, labels and complete framing; repair defects.
- [x] Save assets and adjacent prompt records; update character reference routing and project structure.
- [x] Verify saved images and reference paths; mark Ready for Review.

This is a visual asset task. Verification is direct inspection of the actual rendered images and filesystem integrity; code scaffolding, red/green tests and heavy regression tests do not apply.


## Verification results

- Generated and visually inspected all six sheets against their source references. All eight mood labels per character are present and correctly spelled; Ailan has distinct intact-human and exposed-mechanical body references.
- All six saved PNGs decode at 1536 × 1024; all six prompt records parse and every recorded input path exists.
- Project structure regeneration and check pass; git diff whitespace check passes.
- Original references are preserved. New designs remain subject to user review. No application behavior changed, so code regression tests do not apply.
- Workflow tools TaskCreate/TaskUpdate and verify/run skills are unavailable in this session; progress is recorded above and actual generated images were inspected directly.
- Reference-state guidance is documented in agent_docs/deep_dives/character_reference_states.md.

## Manual Verification

1. Open the two new Ailan turnaround PNGs in reference_images/character/ailan/. Confirm matching identity, fully intact human clothing in one, and unobstructed robot body in the other.
2. Open each character's new expression sheet (Chinese Room v2). Confirm eight distinct labeled moods, preserved identity and accessories, and complete framing.
3. Compare the new references with their original sheets and review the state-selection guidance in agent_docs/03_image_gen.md.
