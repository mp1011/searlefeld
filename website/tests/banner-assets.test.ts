import sharp from 'sharp';
import { expect, it } from 'vitest';
import { banners, wideBanners } from '../src/lib/banner';

it('preserves all original pixels and fades only the added right-hand area to transparent', async () => {
  for (const [index, path] of banners.entries()) {
    const original = await sharp(`public${path}`).ensureAlpha().raw().toBuffer();
    const { data, info } = await sharp(`public${wideBanners[index]}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([2430, 270]);
    // Farther into the extension, the drawn continuation should soften into
    // color fields rather than sharp streaks copied from the source edge.
    const verticalVariation = (pixels: Buffer, stride: number, x: number) => {
      let total = 0;
      const background = [233, 223, 204];
      const visible = (offset: number, channel: number) => {
        const alpha = pixels[offset + 3] / 255;
        return pixels[offset + channel] * alpha + background[channel] * (1 - alpha);
      };
      for (let y = 1; y < 270; y++) {
        for (let channel = 0; channel < 3; channel++) {
          total += Math.abs(visible((y * stride + x) * 4, channel) - visible(((y - 1) * stride + x) * 4, channel));
        }
      }
      return total;
    };
    expect(verticalVariation(data, 2430, 2250)).toBeLessThan(verticalVariation(original, 1620, 1619) * 0.2);
    let joinDifference = 0;
    for (let y = 0; y < 270; y++) {
      for (let channel = 0; channel < 3; channel++) {
        joinDifference += Math.abs(data[(y * 2430 + 1620) * 4 + channel] - data[(y * 2430 + 1619) * 4 + channel]);
      }
    }
    expect(joinDifference / (270 * 3)).toBeLessThan(8);
    for (let y = 0; y < 270; y++) {
      expect(data.subarray(y * 2430 * 4, (y * 2430 + 1620) * 4).equals(original.subarray(y * 1620 * 4, (y + 1) * 1620 * 4))).toBe(true);
      expect(data[(y * 2430 + 1620) * 4 + 3]).toBe(255);
      expect(data[(y * 2430 + 2025) * 4 + 3]).toBeGreaterThan(0);
      expect(data[(y * 2430 + 2025) * 4 + 3]).toBeLessThan(255);
      expect(data[(y * 2430 + 2429) * 4 + 3]).toBe(0);
    }
  }
});
