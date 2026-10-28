import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import type { Codex } from '../codex';
import { dispatch } from '../dispatch';
import { panelsTemplate, type Panel } from '../panels';
import { stageHandlers, type StageContext } from '../stages';
import { speechFileName } from '../stages/speech';
import { COMIC_FILE, COMIC_PREV_FILE, layoutPanels, stitchComic, stitchStage } from '../stages/stitch';
import { readStatus, writeStatus } from '../status';

const box = (row: number, column: number, width: number, height: number): Panel => ({
  ...panelsTemplate('x.md').panels[0], row, column, width, height,
});
const grid = [box(0, 0, 50, 50), box(0, 1, 50, 50), box(1, 0, 100, 50)];

describe('layoutPanels', () => {
  it('places a 2x2 grid without overlap, leaving gutters', () => {
    const r = layoutPanels([box(0, 0, 50, 50), box(0, 1, 50, 50), box(1, 0, 50, 50), box(1, 1, 50, 50)], 800, 800, 8);
    expect(r).toEqual([
      { left: 4, top: 4, width: 392, height: 392 },
      { left: 404, top: 4, width: 392, height: 392 },
      { left: 4, top: 404, width: 392, height: 392 },
      { left: 404, top: 404, width: 392, height: 392 },
    ]);
  });

  it('lets a full-width bottom panel span both columns', () => {
    const r = layoutPanels(grid, 800, 800, 8);
    expect(r[2]).toEqual({ left: 4, top: 404, width: 792, height: 392 });
  });
});

const colours = ['#ff0000', '#00ff00', '#0000ff'];
async function setup(skip?: number) {
  const comicDir = mkdtempSync(join(tmpdir(), 'comic-'));
  writeFileSync(join(comicDir, 'panels.json'), JSON.stringify({ ...panelsTemplate('x.md'), panels: grid }));
  for (let i = 0; i < grid.length; i++) {
    if (i === skip) continue;
    // Deliberately the wrong size: it must be resized into the slot.
    await sharp({ create: { width: 30, height: 20, channels: 3, background: colours[i] } }).png().toFile(join(comicDir, speechFileName(i)));
  }
  writeStatus(comicDir, { stage: 7, completed: [1, 2, 3, 4, 5, 6] });
  return comicDir;
}

describe('stitchComic', () => {
  it('writes an 800x800 image with each panel colour in its slot, resizing wrong-sized panels', async () => {
    const comicDir = await setup();
    const path = await stitchComic(comicDir);
    const { data, info } = await sharp(path).raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([800, 800]);
    const at = (x: number, y: number) => [...data.subarray((y * info.width + x) * info.channels).subarray(0, 3)];
    expect(at(200, 200)).toEqual([255, 0, 0]);
    expect(at(600, 200)).toEqual([0, 255, 0]);
    expect(at(400, 600)).toEqual([0, 0, 255]);
  });

  it('names the missing panel image and writes no output', async () => {
    const comicDir = await setup(1);
    await expect(stitchComic(comicDir)).rejects.toThrow('01_background_character_speech.png');
    expect(existsSync(join(comicDir, COMIC_FILE))).toBe(false);
  });
});

const makeCodex = (): Codex => ({ runNonInteractive: vi.fn(), runInteractive: vi.fn(async () => 0) });
const runStage = (comicDir: string, answers: string[], codex: Codex, log: string[] = []) => {
  const ctx: StageContext = { comicDir, status: readStatus(comicDir), codex, ask: async () => answers.shift() ?? 'q', log: (m) => log.push(m) };
  return stitchStage(ctx);
};

describe('stitchStage', () => {
  it('marks the comic complete on yes', async () => {
    const comicDir = await setup();
    const status = await runStage(comicDir, ['y'], makeCodex());
    expect(status.stage).toBe(8);
    expect(status.completed).toContain(7);
  });

  it('launches the interactive tweak once on no, keeps the previous image, then asks again', async () => {
    const comicDir = await setup();
    const codex = makeCodex();
    const status = await runStage(comicDir, ['n', 'y'], codex);
    expect(codex.runInteractive).toHaveBeenCalledTimes(1);
    expect(readFileSync(join(comicDir, COMIC_PREV_FILE))).toEqual(readFileSync(join(comicDir, COMIC_FILE)));
    expect(status.stage).toBe(8);
  });

  it('stays at stage 7 when a panel image is missing', async () => {
    const comicDir = await setup(2);
    const log: string[] = [];
    const status = await runStage(comicDir, ['y'], makeCodex(), log);
    expect(status.stage).toBe(7);
    expect(log.join('\n')).toContain('02_background_character_speech.png');
  });
});

describe('completed comic', () => {
  it('says so and re-stitches on request', async () => {
    const comicDir = await setup();
    writeStatus(comicDir, { stage: 8, completed: [1, 2, 3, 4, 5, 6, 7] });
    const log: string[] = [];
    const answers = ['y', 'y'];
    await dispatch(comicDir, { handlers: stageHandlers, codex: makeCodex(), ask: async () => answers.shift() ?? 'q', log: (m) => log.push(m) });
    expect(log.join('\n')).toContain('complete');
    expect(existsSync(join(comicDir, COMIC_FILE))).toBe(true);
    expect(readStatus(comicDir).stage).toBe(8);
  });
});
