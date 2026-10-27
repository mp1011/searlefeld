# Image generation and visual reference routing

Read this guide whenever a task requests a new image or an edit to an existing image: comic panels, backgrounds, character poses, props, banners, and visual reference sheets. Apply it before writing a generation prompt or calling an image tool. It is creative reference guidance, not a requirement to run the comic CLI for every standalone image.

## Route the request

| Request | Read and use |
|---|---|
| Any Searlefeld image | [Comic premise](comic_notes/README.md), this guide, and only the relevant references below |
| Character or scene containing characters | Relevant bio in `comic_notes/characters/` plus that character's visual reference |
| Apartment scene or background | The apartment state and angle table below; add character references only for occupants in the shot |
| Isolated decoration or prop | Matching prop reference in `comic_notes/reference_images/location/apartment/decorations/` |
| New camera angle | Closest existing angle as primary reference; other angles only to establish room geometry and continuity |
| Banner or ensemble | Relevant cast references plus existing banner images for composition when appropriate |
| Comic CLI generation or changes to its implementation | Also read [the Image Creator plan](plans/image_generator/overall.md); preserve its stage gates |
| Unrelated, non-comic image | Use the applicable image-generation skill and the user's supplied references; do not impose this comic's cast or setting |

Use the available imagegen skill and built-in image generation/editing tool when available. Read the skill before its first use. Do not silently switch to a paid API/CLI workflow. For an image edit, inspect the actual input image first and pass it to the tool; filenames and prose descriptions alone do not establish visual continuity.

## Reference selection and precedence

1. Honor the user's explicit image, state, angle, style and changes first.
2. Inspect the relevant current reference files and read the relevant character/scene notes. Check that paths exist; do not assume a historical filename still exists.
3. Use the selected canonical character, location and prop images as actual generation inputs. Preserve their designs rather than reinventing them from prose.
4. For ordinary apartment scenes, use the `lived_in` image for the closest camera angle. Use the other states only when requested or needed for a specific editing task.
5. Treat old concepts, banners and historical prompt files as supporting context. They do not override the approved character sheets, current apartment states, or the four specific decorations.

If a script and reference disagree on a material visual detail, follow the user's explicit direction and state any necessary assumption. Ask only if the conflict prevents a reasonable result. A genuinely new prop or location can be designed without an existing reference; preserve the established comic style and do not present an experiment as canonical without the user's acceptance.

## Character references

Paths here are relative to `agent_docs/comic_notes/reference_images/`.

| Character | Primary visual reference | Use |
|---|---|---|
| Roko | `character/roko-turnaround-v1.png` | Body, silhouette, materials, proportions and views; read `characters/roko.md` for behavior |
| Max | `character/max-turnaround-v1.png` | Body and paperclip accessories; read `characters/max.md` |
| Ailan | `character/ailan-turnaround-v1.png` | Human presentation and robotic details; read `characters/ailan.md` |
| Chinese Room | `character/chinese-room-dot-matrix-expressions-v1.png` | Monitor-face rendering and expressions; read `characters/chinese_room.md` |
| Group | `character/cast-portrait-v1.png` | Supporting ensemble appearance; individual sheets remain primary for each design |

Chinese Room's visible presence is the wall monitor. Do not invent a fourth free-standing robot body. The human and room behind the wall stay unseen unless the requested scene explicitly reveals them. Chinese Room does not understand Chinese; responses come from a symbol book. The Chinese calligraphy is a chosen decoration, not evidence of fluency. A blank blue monitor in an environment reference is a background placeholder: when Chinese Room is acting in a scene, use the expression reference to render its face on that same monitor.

## Standard cast sizes

For every image containing the cast, read [the sizing instructions](comic_notes/reference_images/character/cast-height-reference.md) and include `character/cast-height-reference-front-v2.png` as an actual scale-reference input alongside the relevant identity sheets. The lineup controls relative scale; individual sheets control design. Ailan (called Alain in the height-reference request) remains the repository's character name.

Use these working production targets: Ailan 175 cm (1.000×), Max 183 cm (1.046×), Roko 191 cm (1.091×, including horns). All three are adult human scale with modest 8 cm steps. Chinese Room is a 90 × 67.5 cm wall monitor centered 160 cm above the floor, not a standing body. These concrete defaults implement the requested relative ordering; they can be revised by the user.

At equal depth, preserve Ailan < Max < Roko. Do not normalize separately cropped turnaround sheets to equal head or body heights. Account for perspective, pose and Roko's habitual slouch without changing underlying size. Keep the monitor's outer dimensions and mounting position stable across panels. Check relative size against the lineup before accepting an image.

## Apartment references: choose a state and camera

All apartment images live in `comic_notes/reference_images/location/apartment/`, relative to this document. The filename is the angle prefix below followed by `-STATE.png`.

| Camera | Filename prefix | Visible geography |
|---|---|---|
| Entrance | `workshop-loft-angle-1-entrance` | Front door ahead, monitor wall on image left, workshop on image right, sofa back in foreground |
| Monitor wall | `workshop-loft-angle-2-monitor-wall` | Factory windows on left, solid monitor wall on right, workbench in left foreground |
| Workbench | `workshop-loft-angle-3-workbench` | Workshop on back left, factory windows behind sofa; entrance and monitor walls outside shot |

| State suffix | When to use | Contents |
|---|---|---|
| `lived_in` | Default for normal scenes in the roommates' home | Four character decorations where visible, pillows, knitted throw, rug, manuals, charging equipment, workshop machinery, tools and parts |
| `decorated` | Clean presentation of the four chosen decorations, or a base for controlled furnishing changes | Bare furniture plus paperclip bonsai, Vlad portrait, unfilled collage, calligraphy and restored monitor where visible |
| `undecorated` | Empty set, redecorating, or furniture/architecture studies | Bare furniture and architecture; monitor and loose contents were removed in these images |

For example, the ordinary monitor-wall reference is `comic_notes/reference_images/location/apartment/workshop-loft-angle-2-monitor-wall-lived_in.png`.

Keep the industrial loft geometry: three-bay factory windows and New York skyline, dark ceiling beams and ducts, wood floor, sage sectional, cream wood-frame armchair, wood coffee table, workshop and low window bookcases. The entrance wall and monitor wall are distinct. The monitor wall is solid: do not add a door, hatch, window or cutaway to it. Do not mirror the room or move furniture merely to fit a shot.

### Fixed character decorations

These paths are relative to the apartment directory.

| Owner | Prop reference | Fixed placement and required detail |
|---|---|---|
| Max | `decorations/max-paperclip-bonsai.png` | Coffee-table centerpiece; gnarled bonsai trunk, silver paperclips instead of leaves, shallow sage pot. It is a small tabletop sculpture, not a full-size tree |
| Chinese Room | `decorations/chinese-room-framed-home.png` | Framed black 家 (home) on ivory paper, on the monitor wall beside the monitor toward the entrance end |
| Roko | `decorations/roko-framed-vlad.png` | Framed Vlad the Impaler portrait on the entrance wall, LEFT of the door when looking toward the door |
| Ailan | `decorations/ailan-placeholder-collage.png` | Entrance wall RIGHT of door, above the bench. Six unfilled slots each say “Place photo here”; center says “Together is our favorite place to be.” Never fill slots with photos |

Use these prop inputs when the prop is prominent, being edited, or insufficiently resolved in the room image. Keep the room image as the composition authority. The collage reference has a brown backdrop: that backdrop is not part of the object and must not become a brown rectangle on the apartment wall.

Show only what the camera can see. The entrance shot can show all four decorations; the monitor-wall shot shows the bonsai and calligraphy but not the door-wall pictures; the workbench shot shows the bonsai while the wall decorations are behind the camera. Do not relocate or duplicate a decoration to make it appear in every panel.

### Lived-in continuity

Use the actual `lived_in` reference for placement, color and clutter density. Keep cream and rusty-orange cushions, cream throw, neutral rug and robot maintenance details consistent. The workshop has pegboard tools, parts organizers, soldering equipment, an articulated arm project, and an enclosed desktop fabrication machine toward the window end. Preserve comfortable residential space around the machinery. Do not turn it into a factory or add random decor that competes with the four character props. For a new sequence, keep any newly introduced object in the same physical location across camera changes.

## Assemble the generation request

1. Identify the deliverable: scene, background, character cutout, prop, banner or reference sheet. Determine whether this is an edit or a new composition.
2. Select and visually inspect the smallest useful reference set. For a scene, start with the closest apartment angle in the right state, then add each visible character's sheet and any important prop close-ups. Do not attach every image in the library indiscriminately.
3. Label input roles explicitly in the prompt: “Image 1: apartment edit target/composition reference; Image 2: Roko identity reference; Image 3: prop detail reference.” Identify which input controls camera, identity and style.
4. State the requested action, pose, expression, framing and scene-specific changes. For an edit, list what must stay unchanged: architecture, camera, furniture, character identity, existing decor and lighting unless the request changes those.
5. Describe perspective and scale for inserted objects. For a new angle, use multiple views to preserve geometry, not to make a collage of camera views.
6. Preserve the polished inked 2D comic look and warm muted palette unless the user asks for a different treatment. Follow the chosen reference for time of day unless the scene changes it.
7. Specify exact visible words and check them afterward. Ailan's unfilled placeholders are part of the joke. Keep 家 correctly formed. For comic pipeline work, follow its dialogue stage rather than baking speech into background assets.
8. Request true transparency for isolated character/prop assets. Request an opaque complete scene for apartment views. Do not confuse a black preview or painted checkerboard with verified transparency.

Example scene prompt structure:

> Image 1 is the lived-in entrance-angle composition reference. Image 2 is Roko's identity reference. Preserve the room geometry, furniture and all visible decorations. Add Roko beside the front door in the requested pose, matching the turnaround design and scene perspective. Keep Vlad left of the door and Ailan's collage right of it with all photo slots unfilled. Preserve the paperclip bonsai on the coffee table and the monitor/calligraphy on the left wall. Use the same inked comic style and warm light. Do not add other occupants or move off-camera objects into view.

## Inspect, save and report

- Inspect every result for character identity, camera/room geometry, prop positions, scale, duplicate objects, unintended occupants, text and requested transparency. For multiple angles, compare continuity across the set.
- Repair targeted errors with the generated image as the edit target and repeat the invariants. Do not claim an unmet requirement is complete; report a persistent limitation honestly.
- Save project deliverables in the workspace, not only in the generator's default output directory. Use `reference_images/character/` for approved character references, `reference_images/location/apartment/` for apartment variants, and its `decorations/` subdirectory for apartment props. Use the strip's workspace for pipeline outputs.
- Preserve originals unless replacement was requested. Use descriptive sibling filenames or versions. Keep the established `-undecorated.png`, `-decorated.png`, and `-lived_in.png` suffixes for apartment states.
- Record the final prompt, input roles, source references and tool used in an adjacent prompt record when creating new reference assets. Report final saved paths to the user.

## Pipeline manifest caveat

`comic_assets/references/manifest.json` is the CLI's reference mapping, not proof that a file exists or is the preferred current visual reference. At the time this guide was added, it still named the removed unsuffixed apartment PNGs and `character/chinese-room-front-v1.png`. Inspect the current manifest and filesystem before relying on them. For direct generation, select the existing files documented above. If the task needs CLI generation, resolve missing mappings as part of that task and validate them; do not silently pass missing paths or restore obsolete assets. This guide does not itself change the manifest or pipeline gates.
