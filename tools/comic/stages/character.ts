import { copyFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { loadPanels, type Panel } from '../panels';
import { backgroundFileName, panelPixelSize, tweakPrompt } from './background';
import { characterDescription } from './character_references';
import { reviewPanels, type PanelResult } from './review';
import type { StageContext, StageHandler } from './index';

export const CHARACTER_STAGE = 5;

export function characterFileName(index: number): string {
  return `${String(index).padStart(2, '0')}_background_and_character.png`;
}

/** Codex prompt adding the panel's characters (no speech) to its background. */
export function characterPrompt(
  panel: Panel, background: string, destination: string, resolveSheet: (sheet: string) => string,
): string {
  const { width, height } = panelPixelSize(panel);
  const cast = panel.characters.filter((c) => c.character.trim());
  const lines = cast.map((c) => `- ${characterDescription(c, resolveSheet)}`).join('\n');
  return [
    `Add the following characters to the comic background image ${background} (${width}x${height} pixels), keeping the background unchanged.`,
    "Use each listed reference sheet for the character's design.",
    lines,
    'Do not include any speech bubbles, dialogue, captions or other text in the image.',
    `Store the result as a PNG in ${destination}.`,
  ].join('\n');
}

export const characterStage: StageHandler = async (ctx: StageContext) => {
  // comic_src/NNN_name -> repo root
  const repoRoot = dirname(dirname(ctx.comicDir));
  const sheetPath = (sheet: string) => resolve(repoRoot, 'agent_docs', 'comic_notes', 'reference_images', sheet);
  const loadCurrent = () => loadPanels(readFileSync(join(ctx.comicDir, 'panels.json'), 'utf8'));

  const generate = async (index: number): Promise<PanelResult> => {
    let panel: Panel;
    try {
      panel = loadCurrent().panels[index];
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
    if (!panel) return { ok: false, message: `panels.json has no panel ${index}` };
    const background = join(ctx.comicDir, backgroundFileName(index));
    if (!existsSync(background)) return { ok: false, message: `background image not found: ${background}` };
    const destination = join(ctx.comicDir, characterFileName(index));
    rmSync(destination, { force: true });
    if (!panel.characters.some((c) => c.character.trim())) {
      copyFileSync(background, destination);
      return { ok: true, message: destination };
    }
    const result = await ctx.codex.runNonInteractive(ctx.comicDir, characterPrompt(panel, background, destination, sheetPath));
    if (!existsSync(destination)) {
      return { ok: false, message: `Codex exited ${result.exitCode} without writing ${destination}` };
    }
    return { ok: true, message: destination };
  };

  const done = await reviewPanels(ctx, CHARACTER_STAGE, {
    label: 'Character image',
    panelCount: loadCurrent().panels.length,
    generate,
    tweak: async (index) => {
      await ctx.codex.runInteractive(ctx.comicDir, tweakPrompt(join(ctx.comicDir, characterFileName(index))));
    },
    exists: (index) => existsSync(join(ctx.comicDir, characterFileName(index))),
  });
  if (!done) return ctx.status;
  return {
    ...ctx.status,
    stage: CHARACTER_STAGE + 1,
    completed: [...new Set([...ctx.status.completed, CHARACTER_STAGE])],
  };
};
