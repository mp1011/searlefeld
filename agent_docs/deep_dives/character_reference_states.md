# Character reference states and facial acting

The October 2026 reference update adds six opaque production sheets: separate human and exposed-robot Ailan turnarounds, plus eight-mood sheets for Ailan, Max, Roko and Chinese Room. See [the image routing guide](../03_image_gen.md#character-references) for current paths.

Ailan's historical sheet uses clothing cutaways. A prompt that merely asks for him in street clothes can reproduce those cutaways; use the human turnaround and explicitly request intact opaque clothing and natural-looking exposed skin. For the exposed state, use the robot turnaround and retain his human-looking head. His face does not change identity between states.

Expression sheets control facial acting, while turnarounds control body design and the shared lineup controls numerical scale. Portrait crops do not redefine height. Chinese Room's brows, eyes and mouth remain black printer dots on tractor-feed paper within the same wall-monitor frame; expressions never authorize a body or general-purpose screen content.

Each new PNG has an adjacent `.prompt.json` containing its exact built-in image-generation prompt and source roles. Input paths resolve relative to that record; the asset path resolves relative to the character reference root. Original sheets are preserved. Verify rendered identity, label spelling, framing and mood differences visually, then decode saved PNGs and resolve recorded input paths. Automated source-text assertions cannot judge visual quality.
