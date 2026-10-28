import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Codex } from '../codex';
import { panelsTemplate, validateLayout, validateReferences, type Panels } from '../panels';
import type { StageContext } from '../stages';
import { fixPrompt, listCast, listReferences, panelDescriptionsPrompt, panelDescriptionsStage } from '../stages/panels';
import { readStatus, writeStatus } from '../status';

const validPanels = (): Panels => {
  const t = panelsTemplate('agent_docs/comic_notes/situations/x.md');
  return {
    ...t,
    title: 'T',
    panels: t.panels.map((p) => ({ ...p, width: 50, height: 50, characters: [{ character: 'Max', action: 'a', mood: 'm', dialogue: 'd' }] })),
  };
};

function setup() {
  const root = mkdtempSync(join(tmpdir(), 'comic-'));
  const comicDir = join(root, 'comic_src', '000_test');
  mkdirSync(comicDir, { recursive: true });
  writeFileSync(join(comicDir, 'panels.json'), JSON.stringify(panelsTemplate('agent_docs/comic_notes/situations/x.md')));
  writeStatus(comicDir, { stage: 2, completed: [1] });
  return { root, comicDir };
}

/** Each call writes the next entry of `outputs` to panels.json (the last one repeats). */
function stub(comicDir: string, outputs: string[]) {
  const prompts: string[] = [];
  const codex: Codex = {
    runNonInteractive: vi.fn(async (_d: string, prompt: string) => {
      writeFileSync(join(comicDir, 'panels.json'), outputs[Math.min(prompts.length, outputs.length - 1)]);
      prompts.push(prompt);
      return { exitCode: 0, output: '' };
    }),
    runInteractive: vi.fn(async () => 0),
  };
  return { codex, prompts };
}

function run(comicDir: string, codex: Codex, answers: string[] = []) {
  const logs: string[] = [];
  const ctx: StageContext = {
    comicDir, status: readStatus(comicDir), codex,
    ask: async () => answers.shift() ?? '3', log: (m) => logs.push(m),
  };
  return panelDescriptionsStage(ctx).then((status) => ({ status, logs }));
}

describe('panelDescriptionsStage', () => {
  const good = JSON.stringify(validPanels());

  it('advances to stage 3 after one Codex call on valid output', async () => {
    const { comicDir } = setup();
    const { codex } = stub(comicDir, [good]);
    const { status, logs } = await run(comicDir, codex);
    expect(codex.runNonInteractive).toHaveBeenCalledTimes(1);
    expect(status.stage).toBe(3);
    expect(logs.join('\n')).toContain('4 panels');
  });

  it('retries with the previous errors and succeeds on the third call', async () => {
    const { comicDir } = setup();
    const { codex, prompts } = stub(comicDir, ['{ bad', '{ worse', good]);
    const { status } = await run(comicDir, codex);
    expect(prompts).toHaveLength(3);
    expect(prompts[1]).toContain('JSON syntax error');
    expect(prompts[2]).toContain('JSON syntax error');
    expect(status.stage).toBe(3);
  });

  it('stops after 1 + 3 calls on persistent broken JSON and names the file and errors', async () => {
    const { comicDir } = setup();
    const { codex } = stub(comicDir, ['{ bad']);
    const { status, logs } = await run(comicDir, codex);
    expect(codex.runNonInteractive).toHaveBeenCalledTimes(4);
    expect(status.stage).toBe(2);
    expect(logs.join('\n')).toContain('panels.json');
    expect(logs.join('\n')).toContain('JSON syntax error');
  });

  it('on the next run offers "fixed by hand" and re-validates', async () => {
    const { comicDir } = setup();
    const { codex } = stub(comicDir, ['{ bad']);
    await run(comicDir, codex);
    writeFileSync(join(comicDir, 'panels.json'), good);
    const second = await run(comicDir, codex, ['2']);
    expect(codex.runNonInteractive).toHaveBeenCalledTimes(4);
    expect(second.status.stage).toBe(3);
  });
});

describe('layout and reference validation', () => {
  it('names rows whose widths sum to 120% and overlapping panels', () => {
    const p = validPanels();
    p.panels[1].width = 70;
    expect(validateLayout(p).join()).toContain('row 0 have widths summing to 120%');
    const q = validPanels();
    q.panels[1].column = 0;
    expect(validateLayout(q).join()).toContain('overlaps');
  });

  it('names a nonexistent reference', () => {
    const p = validPanels();
    p.panels[0].background.reference = 'nope.png';
    expect(validateReferences(p, () => false)[0]).toContain('nope.png');
    expect(validateReferences(p, () => true)).toEqual([]);
  });
});

describe('prompt builder', () => {
  it('contains the cast names and every reference image found in the fixture folder', () => {
    const root = mkdtempSync(join(tmpdir(), 'comic-'));
    mkdirSync(join(root, 'agent_docs/comic_notes/characters'), { recursive: true });
    mkdirSync(join(root, 'agent_docs/comic_notes/reference_images/location/bar'), { recursive: true });
    writeFileSync(join(root, 'agent_docs/comic_notes/characters/max.md'), '');
    writeFileSync(join(root, 'agent_docs/comic_notes/characters/roko.md'), '');
    writeFileSync(join(root, 'agent_docs/comic_notes/reference_images/location/bar/a.png'), '');
    writeFileSync(join(root, 'agent_docs/comic_notes/reference_images/location/b.png'), '');
    const refs = listReferences(root);
    const prompt = panelDescriptionsPrompt({ panelsPath: '/c/panels.json', sourcePath: '/s.md', cast: listCast(root), references: refs });
    expect(refs).toHaveLength(2);
    for (const s of ['max', 'roko', ...refs, '/c/panels.json', '/s.md']) expect(prompt).toContain(s);
    expect(fixPrompt(prompt, '/c/panels.json', ['boom'])).toContain('- boom');
  });
});
