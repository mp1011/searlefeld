import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import type { Codex } from '../codex';
import { panelsTemplate, type Panel } from '../panels';
import { readStatus, writeStatus } from '../status';
import type { StageContext } from '../stages';
import { backgroundPlan, backgroundStage } from '../stages/background';
import { cropBox, listReferenceImages, parseCropHint } from '../stages/background_reference';

const panel = (mode: 'reference' | undefined, reference: string, description: string): Panel => ({
  ...panelsTemplate('x.md').panels[0],
  width: 50,
  height: 50,
  background: { mode, reference, description },
});

describe('cropBox', () => {
  it('centres the largest window at the target aspect ratio without a hint', () => {
    expect(cropBox({ width: 400, height: 200 }, { width: 100, height: 100 })).toEqual({ left: 100, top: 0, width: 200, height: 200 });
  });
  it('honours a hint and clamps it inside the source', () => {
    expect(cropBox({ width: 400, height: 200 }, { width: 100, height: 100 }, { left: 0.1, top: 0, width: 0.25 }))
      .toEqual({ left: 40, top: 0, width: 100, height: 100 });
    expect(cropBox({ width: 400, height: 200 }, { width: 100, height: 100 }, { left: 0.9, top: 0.9, width: 0.9 }))
      .toEqual({ left: 200, top: 0, width: 200, height: 200 });
  });
});

describe('parseCropHint', () => {
  it('takes the last valid object from chatty output', () => {
    expect(parseCropHint('thinking {"a":1}\n{"left":0.1,"top":0.2,"width":0.5}\ndone')).toEqual({ left: 0.1, top: 0.2, width: 0.5 });
    expect(parseCropHint('no json here')).toBeUndefined();
  });
});

describe('backgroundPlan', () => {
  it('reference mode crops when a reference exists', () => {
    expect(backgroundPlan(panel('reference', 'a.png', 'closer'))).toBe('crop');
    expect(backgroundPlan(panel('reference', '', 'closer'))).toBe('none');
  });
});

describe('stage in reference mode', () => {
  it('crops deterministically to the panel size and never asks Codex for an image', async () => {
    const root = mkdtempSync(join(tmpdir(), 'comic-'));
    const comicDir = join(root, 'comic_src', '000_test');
    mkdirSync(comicDir, { recursive: true });
    await sharp({ create: { width: 400, height: 200, channels: 3, background: '#336699' } }).png().toFile(join(root, 'ref.png'));
    writeFileSync(join(comicDir, 'panels.json'), JSON.stringify({ ...panelsTemplate('x.md'), panels: [panel('reference', 'ref.png', 'left half')] }));
    writeStatus(comicDir, { stage: 4, completed: [1, 2, 3] });
    const codex: Codex = {
      runNonInteractive: vi.fn(async () => ({ exitCode: 0, output: '{"left":0,"top":0,"width":0.5}' })),
      runInteractive: vi.fn(async () => 0),
    };
    const ctx: StageContext = { comicDir, status: readStatus(comicDir), codex, ask: async () => 'y', log: () => {} };
    const next = await backgroundStage(ctx);
    const meta = await sharp(join(comicDir, '00_background.png')).metadata();
    expect([meta.width, meta.height]).toEqual([400, 400]);
    expect((codex.runNonInteractive as ReturnType<typeof vi.fn>).mock.calls[0][1]).toContain('Do NOT create');
    expect(next.stage).toBe(5);
  });
});

describe('listReferenceImages', () => {
  it('lists images recursively and skips other files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'refs-'));
    mkdirSync(join(dir, 'sub'));
    writeFileSync(join(dir, 'a.png'), '');
    writeFileSync(join(dir, 'notes.txt'), '');
    writeFileSync(join(dir, 'sub', 'b.jpg'), '');
    expect(listReferenceImages(dir)).toEqual(['a.png', 'sub/b.jpg']);
  });
});

describe('crop feedback', () => {
  it('re-crops with the user feedback and the previous window, never opening an interactive session', async () => {
    const root = mkdtempSync(join(tmpdir(), 'comic-'));
    const comicDir = join(root, 'comic_src', '000_test');
    mkdirSync(comicDir, { recursive: true });
    await sharp({ create: { width: 400, height: 200, channels: 3, background: '#336699' } }).png().toFile(join(root, 'ref.png'));
    writeFileSync(join(comicDir, 'panels.json'), JSON.stringify({ ...panelsTemplate('x.md'), panels: [panel('reference', 'ref.png', 'left half')] }));
    writeStatus(comicDir, { stage: 4, completed: [1, 2, 3] });
    const replies = ['{"left":0,"top":0,"width":0.5}', '{"left":0.5,"top":0,"width":0.5}'];
    const codex: Codex = {
      runNonInteractive: vi.fn(async () => ({ exitCode: 0, output: replies.shift()! })),
      runInteractive: vi.fn(async () => 0),
    };
    const answers = ['n', '1', 'move to the right half', 'y'];
    const ctx: StageContext = { comicDir, status: readStatus(comicDir), codex, ask: async () => answers.shift() ?? 'q', log: () => {} };
    const next = await backgroundStage(ctx);
    const calls = (codex.runNonInteractive as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[1][1]).toContain('move to the right half');
    expect(calls[1][1]).toContain('"left":0');
    expect(codex.runInteractive).not.toHaveBeenCalled();
    expect(next.stage).toBe(5);
  });
});

describe('AI tweak of a cropped image', () => {
  it('offers an interactive tweak as option 3 and keeps the cropped file instead of re-cropping', async () => {
    const root = mkdtempSync(join(tmpdir(), 'comic-'));
    const comicDir = join(root, 'comic_src', '000_test');
    mkdirSync(comicDir, { recursive: true });
    await sharp({ create: { width: 400, height: 200, channels: 3, background: '#336699' } }).png().toFile(join(root, 'ref.png'));
    writeFileSync(join(comicDir, 'panels.json'), JSON.stringify({ ...panelsTemplate('x.md'), panels: [panel('reference', 'ref.png', '')] }));
    writeStatus(comicDir, { stage: 4, completed: [1, 2, 3] });
    const codex: Codex = {
      runNonInteractive: vi.fn(async () => ({ exitCode: 0, output: '' })),
      runInteractive: vi.fn(async () => 0),
    };
    const answers = ['n', '3', 'y'];
    const asked: string[] = [];
    const ctx: StageContext = {
      comicDir, status: readStatus(comicDir), codex, log: () => {},
      ask: async (q) => (asked.push(q), answers.shift() ?? 'q'),
    };
    const next = await backgroundStage(ctx);
    expect(asked.some((q) => q.includes('3. Tweak image with a prompt'))).toBe(true);
    expect(codex.runInteractive).toHaveBeenCalledTimes(1);
    expect(next.stage).toBe(5);
  });
});
