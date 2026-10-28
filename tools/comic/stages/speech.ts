import { copyFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadPanels, type Panel } from '../panels';
import { tweakPrompt } from './background';
import { characterFileName } from './character';
import { reviewPanels, type PanelResult } from './review';
import type { StageContext, StageHandler } from './index';

export const SPEECH_STAGE = 6;

export function speechFileName(index: number): string {
  return `${String(index).padStart(2, '0')}_background_character_speech.png`;
}

/** The panel's spoken lines in order, as `Name: "text"`; characters with no dialogue are skipped. */
export function dialogueLines(panel: Panel): string[] {
  return panel.characters
    .filter((c) => c.character.trim() && c.dialogue.trim())
    .map((c) => `${c.character.trim()}: "${c.dialogue.trim()}"`);
}

/** Codex prompt drawing the panel's dialogue as speech bubbles on its character image. */
export function speechPrompt(panel: Panel, source: string, destination: string): string {
  return [
    `Add speech bubbles to the comic panel image ${source}, keeping the rest of the image unchanged.`,
    'Each bubble must point at the character who speaks it. The lines, in reading order, are:',
    ...dialogueLines(panel).map((l) => `- ${l}`),
    'Spell the text of every line exactly as given, with no changes, additions or omissions.',
    `Store the result as a PNG in ${destination}.`,
  ].join('\n');
}

export const speechStage: StageHandler = async (ctx: StageContext) => {
  const loadCurrent = () => loadPanels(readFileSync(join(ctx.comicDir, 'panels.json'), 'utf8'));

  const generate = async (index: number): Promise<PanelResult> => {
    let panel: Panel;
    try {
      panel = loadCurrent().panels[index];
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
    if (!panel) return { ok: false, message: `panels.json has no panel ${index}` };
    const source = join(ctx.comicDir, characterFileName(index));
    if (!existsSync(source)) return { ok: false, message: `character image not found: ${source}` };
    const destination = join(ctx.comicDir, speechFileName(index));
    rmSync(destination, { force: true });
    if (dialogueLines(panel).length === 0) {
      copyFileSync(source, destination);
      return { ok: true, message: destination };
    }
    const result = await ctx.codex.runNonInteractive(ctx.comicDir, speechPrompt(panel, source, destination));
    if (!existsSync(destination)) {
      return { ok: false, message: `Codex exited ${result.exitCode} without writing ${destination}` };
    }
    return { ok: true, message: destination };
  };

  const done = await reviewPanels(ctx, SPEECH_STAGE, {
    label: 'Speech image',
    panelCount: loadCurrent().panels.length,
    generate,
    reviewNote: (index) => {
      const panel = loadCurrent().panels[index];
      const lines = panel ? dialogueLines(panel) : [];
      return lines.length ? `Expected dialogue for panel ${index}:\n${lines.join('\n')}` : undefined;
    },
    tweak: async (index) => {
      await ctx.codex.runInteractive(ctx.comicDir, tweakPrompt(join(ctx.comicDir, speechFileName(index))));
    },
    exists: (index) => existsSync(join(ctx.comicDir, speechFileName(index))),
  });
  if (!done) return ctx.status;
  return {
    ...ctx.status,
    stage: SPEECH_STAGE + 1,
    completed: [...new Set([...ctx.status.completed, SPEECH_STAGE])],
  };
};
