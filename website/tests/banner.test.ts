import { describe, expect, it } from 'vitest';
import { banners, rotateBanner } from '../src/lib/banner';

describe('banner rotation', () => {
  it('keeps the wide picture source in sync with the selected original', () => {
    const image = { src: '' };
    const source = { srcset: '' };
    rotateBanner(image, { getItem: () => '0', setItem: () => {} }, source);
    expect(image.src).toBe('/banners/ensemble.webp');
    expect(source.srcset).toBe('/banners/ensemble-wide.webp');
  });
  it('cycles through all banners across page loads and wraps', () => {
    let saved: string | null = null;
    const storage = { getItem: () => saved, setItem: (_key: string, value: string) => { saved = value; } };
    const observed: string[] = [];
    for (let load = 0; load < 4; load++) {
      const image = { src: '' };
      rotateBanner(image, storage);
      observed.push(image.src);
    }
    expect(observed).toEqual([...banners, banners[0]]);
  });

  it.each(['invalid', '-1', '500', '1.5'])('recovers from invalid stored index %s', (value) => {
    const image = { src: '' };
    rotateBanner(image, { getItem: () => value, setItem: () => {} });
    expect(image.src).toBe(banners[0]);
  });

  it('keeps a visible banner when browser storage is blocked', () => {
    const image = { src: '' };
    rotateBanner(image, { getItem: () => { throw new Error('blocked'); }, setItem: () => {} });
    expect(image.src).toBe(banners[0]);
  });
});
