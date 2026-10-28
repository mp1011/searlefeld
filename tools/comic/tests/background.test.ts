import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Codex } from '../codex';
import { panelsTemplate, type Panel } from '../panels';
import { readStatus, writeStatus, type Status } from '../status';
import type { StageContext } from '../stages';
import {
  backgroundFileName, backgroundPlan, backgroundPrompt, backgroundStage, panelPixelSize,
} from '../stages/background';

const panel = (reference: string, description: string, width = 50, height = 50): Panel => ({
  ...panelsTemplate('x.md').panels[0],
  width,
  height,
  background: { reference, description },
});

describe('background helpers', () => {
  it('chooses the plan from reference/description', () => {
    expect(backgroundPlan(panel('a.png', ''))).toBe('copy');
    expect(backgroundPlan(panel('a.png', ' tweak '))).toBe('reference');
    expect(backgroundPlan(panel('', 'a room'))).toBe('description');
    expect(backgroundPlan(panel('', ' '))).toBe('none');
  });

  it('derives pixel size from the percentages and names files with two digits', () => {
    expect(panelPixelSize(panel('', 'x', 50, 25))).toEqual({ width: 400, height: 200 });
    expect(backgroundFileName(3)).toBe('03_background.png');
  });

  it('builds prompts with size, description, destination and (reference case only) the reference', () => {
    const withRef = backgroundPrompt(panel('r', 'warmer light'), '/d/00_background.png', '/r/ref.png');
    expect(withRef).toContain('400x400');
    expect(withRef).toContain('/r/ref.png');
    expect(withRef).toContain('warmer light');
    expect(withRef).toContain('/d/00_background.png');
    const noRef = backgroundPrompt(panel('', 'a bar'), '/d/00_background.png');
    expect(noRef).toContain('400x400');
    expect(noRef).toContain('a bar');
    expect(noRef).not.toContain('reference image');
  });
});

/** repoRoot/comic_src/000_test with a panels.json built from the given panels. */
function setup(panels: Panel[], status: Status = { stage: 4, completed: [1, 2, 3] }) {
  const root = mkdtempSync(join(tmpdir(), 'comic-'));
  const comicDir = join(root, 'comic_src', '000_test');
  mkdirSync(comicDir, { recursive: true });
  writeFileSync(join(comicDir, 'panels.json'), JSON.stringify({ ...panelsTemplate('x.md'), panels }));
  writeStatus(comicDir, status);
  return { root, comicDir };
}

function run(comicDir: string, answers: string[], codex: Codex) {
  const ctx: StageContext = {
    comicDir,
    status: readStatus(comicDir),
    codex,
    ask: async () => answers.shift() ?? 'q',
    log: () => {},
  };
  return backgroundStage(ctx);
}

/** A Codex stub whose non-interactive run writes the destination path named in the prompt. */
const writingCodex = (): Codex => ({
  runNonInteractive: vi.fn(async (_dir: string, prompt: string) => {
    const dest = /in (.+_background\.png)\./.exec(prompt)![1];
    writeFileSync(dest, 'img');
    return { exitCode: 0, output: '' };
  }),
  runInteractive: vi.fn(async () => 0),
});

describe('backgroundStage', () => {
  it('copies a reference-only panel byte for byte without calling Codex', async () => {
    const { root, comicDir } = setup([panel('ref.png', '')]);
    writeFileSync(join(root, 'ref.png'), Buffer.from([1, 2, 3, 250]));
    const codex = writingCodex();
    const next = await run(comicDir, ['y'], codex);
    expect(readFileSync(join(comicDir, '00_background.png'))).toEqual(Buffer.from([1, 2, 3, 250]));
    expect(codex.runNonInteractive).not.toHaveBeenCalled();
    expect(next.stage).toBe(5);
  });

  it('with answers y, n->1, y, y over three panels tweaks once, accepts all and moves to stage 5', async () => {
    const { comicDir } = setup([panel('', 'a'), panel('', 'b'), panel('', 'c')]);
    const codex = writingCodex();
    const next = await run(comicDir, ['y', 'n', '1', 'y', 'y'], codex);
    expect(codex.runInteractive).toHaveBeenCalledTimes(1);
    expect(codex.runNonInteractive).toHaveBeenCalledTimes(3);
    expect(next.stage).toBe(5);
    expect(next.completed).toContain(4);
    expect(next.accepted?.['4']).toEqual([0, 1, 2]);
  });

  it('regenerates the panel after the user edits panels.json (n->2)', async () => {
    const { comicDir } = setup([panel('', 'a')]);
    const codex = writingCodex();
    await run(comicDir, ['n', '2', '', 'y'], codex);
    expect(codex.runNonInteractive).toHaveBeenCalledTimes(2);
  });

  it('resumes at the first unaccepted panel when status.json lists accepted ones', async () => {
    const { comicDir } = setup([panel('', 'a'), panel('', 'b'), panel('', 'c')], {
      stage: 4, completed: [1, 2, 3], accepted: { '4': [0, 1] },
    });
    const codex = writingCodex();
    await run(comicDir, ['y'], codex);
    expect(codex.runNonInteractive).toHaveBeenCalledTimes(1);
    expect((codex.runNonInteractive as ReturnType<typeof vi.fn>).mock.calls[0][1]).toContain('02_background.png');
    expect(existsSync(join(comicDir, '00_background.png'))).toBe(false);
  });

  it('saves progress when the user quits midway', async () => {
    const { comicDir } = setup([panel('', 'a'), panel('', 'b')]);
    const next = await run(comicDir, ['y'], writingCodex());
    expect(next.stage).toBe(4);
    expect(readStatus(comicDir).accepted?.['4']).toEqual([0]);
  });

  it('offers retry/quit instead of advancing when Codex writes no file', async () => {
    const { comicDir } = setup([panel('', 'a')]);
    const codex: Codex = {
      runNonInteractive: vi.fn(async () => ({ exitCode: 1, output: '' })),
      runInteractive: vi.fn(async () => 0),
    };
    const next = await run(comicDir, ['r', 'q'], codex);
    expect(codex.runNonInteractive).toHaveBeenCalledTimes(2);
    expect(next.stage).toBe(4);
    expect(readStatus(comicDir).accepted?.['4'] ?? []).toEqual([]);
  });
});
