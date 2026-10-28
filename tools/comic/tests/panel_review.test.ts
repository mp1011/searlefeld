import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Codex } from '../codex';
import { panelsTemplate, type Panels } from '../panels';
import type { StageContext } from '../stages';
import { formatSummary, panelReviewStage } from '../stages/panel_review';
import { readStatus, writeStatus } from '../status';

const valid = (): Panels => {
  const t = panelsTemplate('x.md');
  return {
    ...t,
    title: 'My Title',
    panels: t.panels.map((p, i) => ({
      ...p, width: 50, height: 50,
      background: { description: `bg number ${i}` },
      characters: [{ character: 'Max', action: 'waves', mood: 'happy', dialogue: `hello ${i}` }],
    })),
  };
};

function setup(content: string = JSON.stringify(valid())) {
  const root = mkdtempSync(join(tmpdir(), 'comic-'));
  const comicDir = join(root, 'comic_src', '000_test');
  mkdirSync(comicDir, { recursive: true });
  writeFileSync(join(comicDir, 'panels.json'), content);
  writeStatus(comicDir, { stage: 3, completed: [1, 2] });
  return comicDir;
}

const stubCodex = (): Codex => ({ runNonInteractive: vi.fn(), runInteractive: vi.fn(async () => 0) });

function run(comicDir: string, answers: string[], codex = stubCodex(), onAsk?: (a: string) => void) {
  const logs: string[] = [];
  const ctx: StageContext = {
    comicDir, status: readStatus(comicDir), codex,
    ask: async () => {
      const a = answers.shift() ?? '4';
      onAsk?.(a);
      return a;
    },
    log: (m) => logs.push(m),
  };
  return panelReviewStage(ctx).then((status) => ({ status, logs, codex }));
}

describe('formatSummary', () => {
  it('lists each background and every dialogue line', () => {
    const out = formatSummary(valid());
    expect(out).toContain('My Title');
    for (let i = 0; i < 4; i++) {
      expect(out).toContain(`bg number ${i}`);
      expect(out).toContain(`hello ${i}`);
    }
  });
});

describe('panelReviewStage', () => {
  it('approves a valid file and moves to stage 4', async () => {
    const { status } = await run(setup(), ['3']);
    expect(status.stage).toBe(4);
    expect(status.completed).toContain(3);
  });

  it('refuses to approve an invalid file and stays at stage 3', async () => {
    const { status, logs } = await run(setup('{ bad'), ['3', '4']);
    expect(status.stage).toBe(3);
    expect(logs.join('\n')).toContain('Cannot approve');
    expect(logs.join('\n')).toContain('JSON syntax error');
  });

  it('launches the interactive session once, then approves', async () => {
    const { status, codex } = await run(setup(), ['2', '3']);
    expect(codex.runInteractive).toHaveBeenCalledTimes(1);
    expect((codex.runInteractive as ReturnType<typeof vi.fn>).mock.calls[0][1]).toContain('panels.json');
    expect(status.stage).toBe(4);
  });

  it('re-checks after a hand edit', async () => {
    const dir = setup('{ bad');
    const { status } = await run(dir, ['1', '3'], stubCodex(), (a) => {
      if (a === '1') writeFileSync(join(dir, 'panels.json'), JSON.stringify(valid()));
    });
    expect(status.stage).toBe(4);
  });
});
