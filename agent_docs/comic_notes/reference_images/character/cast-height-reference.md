# Cast height reference: agent instructions

The generated lineup is illustrative, not a calibrated measurement drawing. Its labels specify target sizes; enforce the numerical ratios below for precise scale. Generated ruler drafts were discarded because their ticks did not match the silhouettes.

Use `cast-height-reference-front-v2.png` as the shared scale input for cast image generation. Use each character's existing turnaround or expression sheet for identity, materials and details. Earlier ensemble art and the equal-sized crops on separate turnarounds do not establish relative heights.

The user specified normal human scale for Alain (Ailan in repository filenames), Max slightly taller, and Roko slightly taller again. The following are working production defaults chosen to make that relationship reproducible, not user-specified measurements:

| Character | Total visible standing height | Relative to Ailan |
|---|---|---|
| Ailan | 175 cm, including hair and shoes | 1.000 |
| Max | 183 cm, including head crest | 1.046 |
| Roko | 191 cm, including horn tips | 1.091 |
| Chinese Room | Monitor outer frame 90 cm wide × 67.5 cm high | Wall-mounted object |

Chinese Room's monitor center is 160 cm above the floor (bottom 126.25 cm, top 193.75 cm). Preserve its dot-matrix face and physical frame. Never generate a fourth robot body, stand or visible operator merely to complete a lineup. For existing apartment camera views, retain the established monitor location; these dimensions guide physical scale rather than authorize rearranging the wall.

## Prompt instructions

Attach the height lineup as a scale reference and the relevant individual sheets as identity references. State each input's role. Preserve adult proportions and use a common floor plane. At equal distance, full upright silhouette heights must have the ratio 175:183:191. Roko's horns count toward his total; do not add them above a 191 cm body. Max must not become shorter than Ailan. Roko must not become a giant.

For front reference sheets use a straight-on orthographic camera, equal depth, full bodies, feet aligned, neutral upright poses and a shared ruler. For narrative images retain these physical sizes while allowing coherent perspective, seated poses, bent knees and Roko's tired slouch. Compare equivalent poses at equivalent depth, not raw bounding boxes in a perspective scene. Do not stretch limbs or enlarge heads to force the ordering.

Reusable prompt clause:

> Use the supplied cast height lineup for scale and individual character sheets for identity. Ailan is normal adult human size, 175 cm including hair/shoes; Max is 183 cm including crest; Roko is 191 cm including horns. Keep the modest 8 cm steps and adult proportions at equal depth. Chinese Room is only a 90 × 67.5 cm wall monitor, center 160 cm above the floor. Respect camera perspective and poses without changing these physical dimensions.

## Review

Check all requested cast members appear once, identity matches, feet share a floor when standing at equal depth, and height differences remain modest and ordered. Check Chinese Room's size separately from mounting height. The numerical specification above governs if generated ruler labels or artwork have small inaccuracies. Preserve existing references when revising this sheet.
