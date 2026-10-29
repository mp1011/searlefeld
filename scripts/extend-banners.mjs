import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

// Continue the furniture with generated artwork, then soften and fade only
// the added area. Never stretch scene pixels or modify the original region.
for (const name of ['apartment', 'ensemble', 'lineup']) {
  const directory = new URL('../website/public/banners/', import.meta.url);
  const { data, info } = await sharp(fileURLToPath(new URL(`${name}.webp`, directory)))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const extension = info.width / 2;
  const referenceWidth = 135;
  const continuationPath = fileURLToPath(new URL(`../agent_docs/comic_notes/reference_images/banner/continuations/${name}.png`, import.meta.url));
  // Uniform resize only: the generated reference strip anchors furniture scale.
  const normalized = await sharp(continuationPath).resize({ width: referenceWidth + extension })
    .extract({ left: 0, top: 0, width: referenceWidth + extension, height: info.height })
    .ensureAlpha().raw().toBuffer();
  const colors = await sharp(normalized, { raw: { width: referenceWidth + extension, height: info.height, channels: 4 } })
    .blur(32).raw().toBuffer();
  const width = info.width + extension;
  const output = Buffer.alloc(width * info.height * 4);
  for (let y = 0; y < info.height; y++) {
    data.copy(output, y * width * 4, y * info.width * 4, (y + 1) * info.width * 4);
    for (let x = 0; x < extension; x++) {
      const offset = (y * width + info.width + x) * 4;
      const color = (y * (referenceWidth + extension) + referenceWidth + x) * 4;
      const edgeColor = (y * (referenceWidth + extension) + referenceWidth) * 4;
      const originalEdge = (y * info.width + info.width - 1) * 4;
      const softening = Math.min(1, Math.max(0, (x - 100) / 350));
      const blurMix = softening * softening * (3 - 2 * softening);
      // Match boundary colors, decaying over a short join into the drawn scene.
      const correction = Math.max(0, 1 - x / 48) ** 2;
      for (let channel = 0; channel < 3; channel++) {
        const drawn = normalized[color + channel];
        const value = drawn * (1 - blurMix) + colors[color + channel] * blurMix
          + (data[originalEdge + channel] - normalized[edgeColor + channel]) * correction;
        output[offset + channel] = Math.max(0, Math.min(255, Math.round(value)));
      }
      const t = Math.max(0, (x - 80) / (extension - 81));
      const alpha = normalized[color + 3] + (255 - normalized[color + 3]) * correction;
      output[offset + 3] = Math.round(alpha * (1 - t * t * (3 - 2 * t)));
    }
  }
  await sharp(output, { raw: { width, height: info.height, channels: 4 } })
    .webp({ lossless: true }).toFile(fileURLToPath(new URL(`${name}-wide.webp`, directory)));
}
