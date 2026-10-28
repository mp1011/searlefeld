---
status: Done
---

# PROBLEM
While the mechanism of image generation in `agent_docs\plans\image_generator\background_generation\background_generation_stage.md` works, agents seem unable to reliably make alternate version of reference images without losing some important details or adding unwanted elements.

We still want the current background system as it will be helpful when we want a new image, or when accuracy to the reference image is not desired.

# PROPOSAL
Add an additional option for background image generation.
    1. Create image from prompt (existing system)
    2. Use Reference image

## Reference Image
- in this mode, we will not create a NEW image, instead we'll perform manipulations of a source image.
    - the image may be cropped (do this via a deterministic tool)
    - based on the location of the comic, give the user the choice of one of the reference images in the appropriate location folder
    - the image prompt is used to determine whether any cropping or other image editting is required, however we will NOT generate a new image with ai. We're strictly performing operations on the existing reference image

# IMPLEMENTATION NOTES
- `panels.json` `background.mode: "reference"` selects the new mode (default/absent = existing AI generation, unchanged). It requires `background.reference`.
- In the review loop's "What next?" menu, option 3 "Use a reference image (crop only, no AI generation)" lists images in the current reference's folder (or all of `reference_images/location`), writes the choice and `mode` into `panels.json`, and regenerates.
- No AI image generation in this mode. With a description, Codex is asked only to reply with a crop window as JSON fractions (`left`, `top`, `width`; height follows the panel aspect ratio); `sharp` does the crop and resize to the panel pixel size deterministically. With an empty description it is a centred crop with no Codex call.
- Code: `tools/comic/stages/background_reference.ts`, wiring in `stages/background.ts`, `extraActions` in `stages/review.ts`; tests in `tools/comic/tests/background_reference.test.ts`. New dev dependency: `sharp`.
- Not manually verified against a real `codex exec` crop reply; the stage test stubs Codex.
- `run-checks.sh` currently fails only the Plan Drift Check because `plans/image_generator/background_generation_stage.md` was moved without frontmatter registration (pre-existing in the working tree).
- Crop feedback: for a reference-mode panel, "What next?" → option 1 asks "Any feedback on the crop?" (blank leaves it). Codex gets the previous window plus the feedback and returns a new window; the tool re-crops. No interactive Codex session is opened for crop panels.
- Deferred: blurring part of the image (focus region via Codex, or depth-based). Not started.
- Rerun behaviour: an existing, unaccepted `NN_background.png` goes straight to review instead of being regenerated (choose n → edit panels.json to force regeneration).
- Crop panels' "What next?" menu: 1) Adjust the crop with feedback, 2) edit panels.json, 3) Tweak image with a prompt (interactive Codex session on the cropped file, not re-cropped afterwards), 4) pick another reference image.
