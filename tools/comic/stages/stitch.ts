import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { writeFileAtomic } from '../fsutil';
import { loadPanels, type Panel } from '../panels';
import { LAST_STAGE } from '../status';
import { COMIC_HEIGHT, COMIC_WIDTH, GUTTER, tweakPrompt } from './background';
import { speechFileName } from './speech';
import type { StageContext, StageHandler } from './index';

export const STITCH_STAGE = 7;
export const COMIC_FILE = 'comic_full.png';
export const COMIC_PREV_FILE = 'comic_full.prev.png';

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Pixel rectangle per panel (same order as `panels`). Panels sit in a grid: a row starts below the
 * tallest panel of the rows above it, and a panel starts right of the widths of the columns before it.
 * Each slot is inset by half a gutter on every side.
 */
export function layoutPanels(panels: Panel[], totalWidth: number, totalHeight: number, gutter = GUTTER): Rect[] {
  const rowHeights = new Map<number, number>();
  for (const p of panels) rowHeights.set(p.row, Math.max(rowHeights.get(p.row) ?? 0, p.height));
  const rowTop = (row: number) =>
    [...rowHeights].filter(([r]) => r < row).reduce((sum, [, h]) => sum + h, 0);
  const inset = gutter / 2;
  return panels.map((p) => {
    const x = panels.filter((o) => o.row === p.row && o.column < p.column).reduce((sum, o) => sum + o.width, 0);
    const left = Math.round((totalWidth * x) / 100 + inset);
    const top = Math.round((totalHeight * rowTop(p.row)) / 100 + inset);
    const right = Math.round((totalWidth * (x + p.width)) / 100 - inset);
    const bottom = Math.round((totalHeight * (rowTop(p.row) + p.height)) / 100 - inset);
    return { left, top, width: right - left, height: bottom - top };
  });
}

/** Composites the speech images into comic_full.png; throws, writing nothing, if any panel image is missing. */
export async function stitchComic(comicDir: string): Promise<string> {
  const { panels } = loadPanels(readFileSync(join(comicDir, 'panels.json'), 'utf8'));
  const names = panels.map((_, i) => speechFileName(i));
  const missing = names.filter((n) => !existsSync(join(comicDir, n)));
  if (missing.length > 0) throw new Error(`Missing panel image(s): ${missing.join(', ')}`);
  const rects = layoutPanels(panels, COMIC_WIDTH, COMIC_HEIGHT);
  const layers = await Promise.all(
    rects.map(async (r, i) => ({
      input: await sharp(join(comicDir, names[i])).resize(r.width, r.height, { fit: 'fill' }).png().toBuffer(),
      left: r.left,
      top: r.top,
    })),
  );
  const buffer = await sharp({
    create: { width: COMIC_WIDTH, height: COMIC_HEIGHT, channels: 3, background: '#ffffff' },
  }).composite(layers).png().toBuffer();
  const destination = join(comicDir, COMIC_FILE);
  writeFileAtomic(destination, buffer);
  return destination;
}

const isYes = (answer: string) => /^y/i.test(answer.trim());

/** Stitches, then loops accept / Codex-tweak until the user accepts. Returns true when accepted. */
export async function stitchAndApprove(ctx: StageContext): Promise<boolean> {
  const image = join(ctx.comicDir, COMIC_FILE);
  const previous = join(ctx.comicDir, COMIC_PREV_FILE);
  try {
    await stitchComic(ctx.comicDir);
  } catch (e) {
    ctx.log((e as Error).message);
    return false;
  }
  for (;;) {
    ctx.log(`Final comic: ${image}`);
    const answer = await ctx.ask('Accept the final image? (y/n, q to quit and resume later) ');
    if (isYes(answer)) return true;
    if (/^q/i.test(answer.trim())) return false;
    copyFileSync(image, previous);
    await ctx.codex.runInteractive(ctx.comicDir, tweakPrompt(image));
    ctx.log(`The previous image is kept as ${previous}; copy it over ${COMIC_FILE} to undo the edit.`);
  }
}

export const stitchStage: StageHandler = async (ctx) => {
  if (!(await stitchAndApprove(ctx))) return ctx.status;
  return { ...ctx.status, stage: LAST_STAGE + 1, completed: [...new Set([...ctx.status.completed, STITCH_STAGE])] };
};

/** Handles a finished comic: reports it and offers to stitch and approve again. */
export const completedStage: StageHandler = async (ctx) => {
  ctx.log('This comic is complete.');
  if (isYes(await ctx.ask('Re-stitch the final image? (y/n) '))) await stitchAndApprove(ctx);
  return ctx.status;
};
