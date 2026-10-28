import { readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import sharp from 'sharp';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

export interface CropBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** What the model returns: a window as fractions (0-1) of the source; height follows the panel's aspect ratio. */
export interface CropHint {
  left: number;
  top: number;
  width: number;
}

/** Image files under `dir`, as paths relative to it (forward slashes), sorted. */
export function listReferenceImages(dir: string): string[] {
  const found: string[] = [];
  const walk = (current: string) => {
    for (const name of readdirSync(current).sort()) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (IMAGE_EXTENSIONS.has(extname(name).toLowerCase())) {
        found.push(relative(dir, full).split('\\').join('/'));
      }
    }
  };
  walk(dir);
  return found;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The pixel box to cut from the source: a window at the target aspect ratio.
 * With no hint it is the largest centred window; a hint narrows and moves it, and the result
 * always stays inside the source.
 */
export function cropBox(
  source: { width: number; height: number },
  target: { width: number; height: number },
  hint?: CropHint,
): CropBox {
  const aspect = target.width / target.height;
  const maxWidth = Math.min(source.width, source.height * aspect);
  const width = Math.round(hint ? clamp(hint.width * source.width, 1, maxWidth) : maxWidth);
  const height = Math.min(source.height, Math.round(width / aspect));
  const left = hint ? clamp(Math.round(hint.left * source.width), 0, source.width - width) : Math.round((source.width - width) / 2);
  const top = hint ? clamp(Math.round(hint.top * source.height), 0, source.height - height) : Math.round((source.height - height) / 2);
  return { left, top, width, height };
}

/** Extracts the last JSON object in `output` that carries numeric left/top/width, or undefined. */
export function parseCropHint(output: string): CropHint | undefined {
  const objects = output.match(/\{[^{}]*\}/g) ?? [];
  for (const text of objects.reverse()) {
    try {
      const o = JSON.parse(text) as Record<string, unknown>;
      if ([o.left, o.top, o.width].every((v) => typeof v === 'number' && Number.isFinite(v))) {
        return { left: o.left as number, top: o.top as number, width: o.width as number };
      }
    } catch {
      // not JSON; keep looking
    }
  }
  return undefined;
}

export function cropPrompt(
  reference: string,
  source: { width: number; height: number },
  target: { width: number; height: number },
  description: string,
  revision?: { previous: CropHint; feedback: string },
): string {
  return [
    `Look at the image ${reference} (${source.width}x${source.height} pixels). Do NOT create, edit or save any image.`,
    `A comic panel of aspect ratio ${target.width}:${target.height} must be cut out of it as a crop. Panel description: ${description}`,
    ...(revision
      ? [`An earlier crop used ${JSON.stringify(revision.previous)}. The user's feedback on it: ${revision.feedback}. Adjust the window accordingly.`]
      : []),
    'Choose the crop window that best frames what the description asks for, without cutting off anything it says must stay in view and without including anything it says to keep out of frame.',
    'Reply with only a JSON object whose values are fractions between 0 and 1 of the source image: {"left": <x of the window\'s left edge / image width>, "top": <y of the window\'s top edge / image height>, "width": <window width / image width>}. The window height is derived automatically from the aspect ratio. To keep the whole image use {"left": 0, "top": 0, "width": 1}.',
  ].join('\n');
}

/** The box expressed back as a hint, so a revision prompt can show the model what was used. */
export function boxToHint(box: CropBox, source: { width: number; height: number }): CropHint {
  const round = (v: number) => Math.round(v * 1000) / 1000;
  return { left: round(box.left / source.width), top: round(box.top / source.height), width: round(box.width / source.width) };
}

export async function imageSize(path: string): Promise<{ width: number; height: number }> {
  const { width, height } = await sharp(path).metadata();
  if (!width || !height) throw new Error(`cannot read image size: ${path}`);
  return { width, height };
}

/** Crops `box` out of `source` and scales it to exactly `target`, writing a PNG. No AI involved. */
export async function cropAndResize(
  source: string,
  box: CropBox,
  target: { width: number; height: number },
  destination: string,
): Promise<void> {
  await sharp(source).extract(box).resize(target.width, target.height, { fit: 'fill' }).png().toFile(destination);
}
