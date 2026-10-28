import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Codex } from '../codex';
import { panelsTemplate, type Panel, type PanelCharacter } from '../panels';
import { readStatus, writeStatus } from '../status';
import type { StageContext } from '../stages';
import { speechFileName, speechPrompt, speechStage } from '../stages/speech';

const who = (character: string, dialogue: string): PanelCharacter => ({ character, action: 'a', mood: 'm', dialogue });
const panel = (characters: PanelCharacter[]): Panel => ({
  ...panelsTemplate('x.md').panels[0], width: 50, height: 50, background: { mode: 'generate', description: 'room' }, characters,
});

describe('speechPrompt', () => {
  it('includes both lines verbatim in order, tied to speakers, with source and destination', () => {
    const p = speechPrompt(panel([who('Roko', 'Ugh, Mondays.'), who('Max', 'It is Tuesday!')]), '/d/00_c.png', '/d/00_s.png');
    expect(p).toContain('Roko: "Ugh, Mondays."');
    expect(p.indexOf('Max: "It is Tuesday!"')).toBeGreaterThan(p.indexOf('Roko: "Ugh, Mondays."'));
    expect(p).toContain('/d/00_c.png');
    expect(p).toContain('/d/00_s.png');
  });
});

function setup(panels: Panel[]) {
  const root = mkdtempSync(join(tmpdir(), 'comic-'));
  const comicDir = join(root, 'comic_src', '000_test');
  mkdirSync(comicDir, { recursive: true });
  writeFileSync(join(comicDir, 'panels.json'), JSON.stringify({ ...panelsTemplate('x.md'), panels }));
  panels.forEach((_, i) => writeFileSync(join(comicDir, `0${i}_background_and_character.png`), Buffer.from([i, 7])));
  writeStatus(comicDir, { stage: 6, completed: [1, 2, 3, 4, 5] });
  return comicDir;
}

function run(comicDir: string, answers: string[], codex: Codex, log: string[] = []) {
  const ctx: StageContext = { comicDir, status: readStatus(comicDir), codex, ask: async () => answers.shift() ?? 'q', log: (m) => log.push(m) };
  return speechStage(ctx);
}

describe('speechStage', () => {
  it('copies the character image without Codex when nobody speaks, and advances to stage 7', async () => {
    const comicDir = setup([panel([who('Roko', '')])]);
    const codex: Codex = { runNonInteractive: vi.fn(async () => ({ exitCode: 0, output: '' })), runInteractive: vi.fn(async () => 0) };
    const status = await run(comicDir, ['y'], codex);
    expect(codex.runNonInteractive).not.toHaveBeenCalled();
    expect(readFileSync(join(comicDir, speechFileName(0)))).toEqual(readFileSync(join(comicDir, '00_background_and_character.png')));
    expect(status.stage).toBe(7);
  });

  it('shows the expected dialogue at review and advances once every panel is accepted', async () => {
    const comicDir = setup([panel([who('Roko', 'Hello there')]), panel([who('Max', 'Bye now')])]);
    const codex: Codex = {
      runNonInteractive: vi.fn(async (_d: string, prompt: string) => {
        writeFileSync(/in (.+_background_character_speech\.png)\./.exec(prompt)![1], 'img');
        return { exitCode: 0, output: '' };
      }),
      runInteractive: vi.fn(async () => 0),
    };
    const log: string[] = [];
    const status = await run(comicDir, ['y', 'y'], codex, log);
    expect(codex.runNonInteractive).toHaveBeenCalledTimes(2);
    expect(existsSync(join(comicDir, speechFileName(1)))).toBe(true);
    expect(log.join('\n')).toContain('Roko: "Hello there"');
    expect(log.join('\n')).toContain('Max: "Bye now"');
    expect(status.stage).toBe(7);
    expect(readStatus(comicDir).accepted?.['6']).toEqual([0, 1]);
  });
});
