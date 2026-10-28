import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Codex } from '../codex';
import { panelsTemplate, type Panel, type PanelCharacter } from '../panels';
import { readStatus, writeStatus } from '../status';
import type { StageContext } from '../stages';
import { characterFileName, characterPrompt, characterStage } from '../stages/character';

const who = (character: string, action: string, mood: string): PanelCharacter => ({ character, action, mood, dialogue: 'SECRET LINE' });
const panel = (characters: PanelCharacter[]): Panel => ({
  ...panelsTemplate('x.md').panels[0], width: 50, height: 50, background: { mode: 'generate', description: 'room' }, characters,
});
const sheet = (s: string) => `/refs/${s}`;

describe('characterPrompt', () => {
  it('names background, characters, actions, moods, sheets, no-speech rule and destination, without dialogue', () => {
    const p = characterPrompt(panel([who('Roko', 'slouches', 'bored'), who('Max', 'waves', 'cheery')]), '/d/00_background.png', '/d/00_background_and_character.png', sheet);
    for (const s of ['/d/00_background.png', 'slouches', 'bored', 'waves', 'cheery', '/refs/character/roko-turnaround-v1.png', '/refs/character/max-turnaround-v1.png', 'Do not include any speech', '/d/00_background_and_character.png']) {
      expect(p).toContain(s);
    }
    expect(p).not.toContain('SECRET LINE');
  });

  it('describes an unknown character from text only', () => {
    const p = characterPrompt(panel([who('Zed', 'sits', 'calm')]), '/b.png', '/d.png', sheet);
    expect(p).toContain('Zed');
    expect(p).toContain('sits');
    expect(p).not.toContain('/refs/');
  });
});

function setup(panels: Panel[]) {
  const root = mkdtempSync(join(tmpdir(), 'comic-'));
  const comicDir = join(root, 'comic_src', '000_test');
  mkdirSync(comicDir, { recursive: true });
  writeFileSync(join(comicDir, 'panels.json'), JSON.stringify({ ...panelsTemplate('x.md'), panels }));
  panels.forEach((_, i) => writeFileSync(join(comicDir, `0${i}_background.png`), Buffer.from([i, 9])));
  writeStatus(comicDir, { stage: 5, completed: [1, 2, 3, 4] });
  return comicDir;
}

function run(comicDir: string, answers: string[], codex: Codex) {
  const ctx: StageContext = { comicDir, status: readStatus(comicDir), codex, ask: async () => answers.shift() ?? 'q', log: () => {} };
  return characterStage(ctx);
}

describe('characterStage', () => {
  it('copies the background without calling Codex for a panel with no characters, and advances to stage 6', async () => {
    const comicDir = setup([panel([])]);
    const codex: Codex = { runNonInteractive: vi.fn(async () => ({ exitCode: 0, output: '' })), runInteractive: vi.fn(async () => 0) };
    const status = await run(comicDir, ['y'], codex);
    expect(codex.runNonInteractive).not.toHaveBeenCalled();
    expect(readFileSync(join(comicDir, characterFileName(0)))).toEqual(readFileSync(join(comicDir, '00_background.png')));
    expect(status.stage).toBe(6);
  });

  it('generates with Codex and advances once every panel is accepted', async () => {
    const comicDir = setup([panel([who('Roko', 'a', 'b')]), panel([who('Max', 'c', 'd')])]);
    const codex: Codex = {
      runNonInteractive: vi.fn(async (_d: string, prompt: string) => {
        writeFileSync(/in (.+_background_and_character\.png)\./.exec(prompt)![1], 'img');
        return { exitCode: 0, output: '' };
      }),
      runInteractive: vi.fn(async () => 0),
    };
    const status = await run(comicDir, ['y', 'y'], codex);
    expect(codex.runNonInteractive).toHaveBeenCalledTimes(2);
    expect(existsSync(join(comicDir, characterFileName(1)))).toBe(true);
    expect(status.stage).toBe(6);
    expect(readStatus(comicDir).accepted?.['5']).toEqual([0, 1]);
  });
});
