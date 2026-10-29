export const banners = [
  '/banners/apartment.webp',
  '/banners/ensemble.webp',
  '/banners/lineup.webp',
] as const;

export const wideBanners = banners.map((path) => path.replace('.webp', '-wide.webp'));

const storageKey = 'searlefeld-banner-index';

export function rotateBanner(
  image: { src: string },
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  source?: { srcset: string },
): void {
  let index = 0;
  try {
    const previous = storage.getItem(storageKey);
    const parsed = previous === null ? -1 : Number(previous);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < banners.length) {
      index = (parsed + 1) % banners.length;
    }
    storage.setItem(storageKey, String(index));
  } catch {
    // Privacy settings may disable storage; the first banner still works.
  }
  if (source) source.srcset = wideBanners[index];
  image.src = banners[index];
}
