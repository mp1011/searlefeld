import { copyFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { loadPanels, type Panel } from '../panels';
import { reviewPanels, type PanelResult } from './review';
import type { StageHandler } from './index';

export const BACKGROUND_STAGE = 4;

/** Total comic area in pixels; panel width/height percentages are applied to this. */
export const COMIC_WIDTH = 800;
export const COMIC_HEIGHT = 800;

export type BackgroundPlan = 'copy' | 'reference' | 'description' | 'none';

export function panelPixelSize(panel: Panel): { width: number; height: number } {
  return {
    width: Math.round((COMIC_WIDTH * panel.width) / 100),
    height: Math.round((COMIC_HEIGHT * panel.height) / 100),
  };
}

export function backgroundFileName(index: number): string {
  return `${String(index).padStart(2, '0')}_background.png`;
}

export function backgroundPlan(panel: Panel): BackgroundPlan {
  const hasReference = !!panel.background.reference?.trim();
  const hasDescription = !!panel.background.description.trim();
  if (hasReference) return hasDescription ? 'reference' : 'copy';
  return hasDescription ? 'description' : 'none';
}

/** Codex prompt for the two plans that need it. `reference` is the resolved path. */
export function backgroundPrompt(panel: Panel, destination: string, reference?: string): string {
  const { width, height } = panelPixelSize(panel);
  const size = `${width}x${height} pixels`;
  const description = panel.background.description.trim();
  const save = `Store the result as a PNG in ${destination}.`;
  return reference
    ? `Create a comic background image of size ${size}, using reference image ${reference}. Additional adjustments: ${description}. ${save}`
    : `Create a comic background image of size ${size}. ${description}. ${save}`;
}

export function tweakPrompt(imagePath: string): string {
  return `Work with the user to adjust the image ${imagePath}. The user will specify what they want to change. Save the edited image over the same path.`;
}

/** References may be absolute, repo-relative, or relative to the shared reference images. */
export function resolveReference(repoRoot: string, reference: string): string {
  if (isAbsolute(reference)) return reference;
  const candidates = [
    resolve(repoRoot, reference),
    resolve(repoRoot, 'agent_docs', 'comic_notes', 'reference_images', reference),
  ];
  return candidates.find(existsSync) ?? candidates[0];
}

export const backgroundStage: StageHandler = async (ctx) => {
  // comic_src/NNN_name -> repo root
  const repoRoot = dirname(dirname(ctx.comicDir));
  const loadCurrent = () => loadPanels(readFileSync(join(ctx.comicDir, 'panels.json'), 'utf8'));

  const generate = async (index: number): Promise<PanelResult> => {
    let panel: Panel;
    try {
      panel = loadCurrent().panels[index];
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
    if (!panel) return { ok: false, message: `panels.json has no panel ${index}` };
    const plan = backgroundPlan(panel);
    if (plan === 'none') {
      return { ok: false, message: 'background needs a reference, a description, or both' };
    }
    const destination = join(ctx.comicDir, backgroundFileName(index));
    const reference = panel.background.reference?.trim()
      ? resolveReference(repoRoot, panel.background.reference.trim())
      : undefined;
    if (reference && !existsSync(reference)) {
      return { ok: false, message: `reference image not found: ${reference}` };
    }
    rmSync(destination, { force: true });
    if (plan === 'copy') {
      copyFileSync(reference!, destination);
    } else {
      const result = await ctx.codex.runNonInteractive(ctx.comicDir, backgroundPrompt(panel, destination, reference));
      if (!existsSync(destination)) {
        return { ok: false, message: `Codex exited ${result.exitCode} without writing ${destination}` };
      }
    }
    return { ok: true, message: destination };
  };

  const tweak = async (index: number) => {
    await ctx.codex.runInteractive(ctx.comicDir, tweakPrompt(join(ctx.comicDir, backgroundFileName(index))));
  };

  const panelCount = loadCurrent().panels.length;
  const done = await reviewPanels(ctx, BACKGROUND_STAGE, { label: 'Background image', panelCount, generate, tweak });
  if (!done) return ctx.status;
  return {
    ...ctx.status,
    stage: BACKGROUND_STAGE + 1,
    completed: [...new Set([...ctx.status.completed, BACKGROUND_STAGE])],
  };
};
