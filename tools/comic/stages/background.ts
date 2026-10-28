import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { loadPanels, type Panel } from '../panels';
import { chooseOption } from '../menu';
import {
  boxToHint, type CropHint, cropAndResize, cropBox, cropPrompt, imageSize, listReferenceImages, parseCropHint,
} from './background_reference';
import { reviewPanels, type PanelResult } from './review';
import type { StageContext, StageHandler } from './index';

export const BACKGROUND_STAGE = 4;

/** Total comic area in pixels; panel width/height percentages are applied to this. */
export const COMIC_WIDTH = 800;
export const COMIC_HEIGHT = 800;

export type BackgroundPlan = 'copy' | 'reference' | 'description' | 'crop' | 'none';

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
  if (panel.background.mode === 'reference') return panel.background.reference?.trim() ? 'crop' : 'none';
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

/**
 * Crops the reference to the panel; Codex only picks the window from the description (and any
 * user feedback on the previous crop), the tool does the cutting. Returns the window used.
 */
async function cropReference(
  ctx: StageContext, panel: Panel, reference: string, destination: string,
  revision?: { previous: CropHint; feedback: string },
): Promise<CropHint> {
  const source = await imageSize(reference);
  const target = panelPixelSize(panel);
  const description = panel.background.description.trim();
  let hint: CropHint | undefined;
  if (description || revision) {
    const result = await ctx.codex.runNonInteractive(ctx.comicDir, cropPrompt(reference, source, target, description, revision));
    hint = parseCropHint(result.output);
    if (!hint) throw new Error(`Codex gave no crop window (exit ${result.exitCode}); see logs/ for its reply`);
  }
  const box = cropBox(source, target, hint);
  await cropAndResize(reference, box, target, destination);
  return boxToHint(box, source);
}

export const backgroundStage: StageHandler = async (ctx) => {
  // comic_src/NNN_name -> repo root
  const repoRoot = dirname(dirname(ctx.comicDir));
  const loadCurrent = () => loadPanels(readFileSync(join(ctx.comicDir, 'panels.json'), 'utf8'));

  const lastCrop = new Map<number, CropHint>();

  const generate = async (index: number): Promise<PanelResult> => {
    let panel: Panel;
    try {
      panel = loadCurrent().panels[index];
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
    if (!panel) return { ok: false, message: `panels.json has no panel ${index}` };
    if (!panel.background.mode) {
      const description = panel.background.description.trim() || '(no description)';
      const choice = await chooseOption(ctx.ask, `Panel ${index}: ${description}\nHow should the background be made?`, [
        'Create an image from the prompt (AI)',
        'Use a reference image (crop only, no AI generation)',
      ]);
      if (choice === 1) await useReferenceImage(index);
      else setMode(index, 'generate');
      try {
        panel = loadCurrent().panels[index];
      } catch (e) {
        return { ok: false, message: (e as Error).message };
      }
    }
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
    if (plan === 'crop') {
      try {
        lastCrop.set(index, await cropReference(ctx, panel, reference!, destination));
      } catch (e) {
        return { ok: false, message: (e as Error).message };
      }
    } else if (plan === 'copy') {
      copyFileSync(reference!, destination);
    } else {
      const result = await ctx.codex.runNonInteractive(ctx.comicDir, backgroundPrompt(panel, destination, reference));
      if (!existsSync(destination)) {
        return { ok: false, message: `Codex exited ${result.exitCode} without writing ${destination}` };
      }
    }
    return { ok: true, message: destination };
  };

  const aiTweak = async (index: number) => {
    await ctx.codex.runInteractive(ctx.comicDir, tweakPrompt(join(ctx.comicDir, backgroundFileName(index))));
  };

  const isCrop = (index: number) => {
    try {
      return backgroundPlan(loadCurrent().panels[index]) === 'crop';
    } catch {
      return false;
    }
  };

  const tweak = async (index: number) => {
    const panel = loadCurrent().panels[index];
    if (backgroundPlan(panel) === 'crop') {
      const feedback = (await ctx.ask('Any feedback on the crop? (what should change; blank to leave it) ')).trim();
      if (!feedback) return;
      const reference = resolveReference(repoRoot, panel.background.reference!.trim());
      const previous = lastCrop.get(index) ?? { left: 0, top: 0, width: 1 };
      try {
        lastCrop.set(index, await cropReference(ctx, panel, reference, join(ctx.comicDir, backgroundFileName(index)), { previous, feedback }));
        ctx.log('Crop updated.');
      } catch (e) {
        ctx.log((e as Error).message);
      }
      return;
    }
    await aiTweak(index);
  };

  const setMode = (index: number, mode: 'generate') => {
    const file = join(ctx.comicDir, 'panels.json');
    const data = JSON.parse(readFileSync(file, 'utf8'));
    if (!data.panels?.[index]) return;
    data.panels[index].background.mode = mode;
    writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  };

  const useReferenceImage = async (index: number) => {
    const file = join(ctx.comicDir, 'panels.json');
    const data = JSON.parse(readFileSync(file, 'utf8'));
    const panel = data.panels?.[index];
    if (!panel) return;
    const current = panel.background.reference?.trim();
    // Offer the current reference's location folder, else every location reference.
    const locationRoot = join(repoRoot, 'agent_docs', 'comic_notes', 'reference_images', 'location');
    const folder = current && existsSync(resolveReference(repoRoot, current))
      ? dirname(resolveReference(repoRoot, current))
      : locationRoot;
    const images = listReferenceImages(folder);
    if (images.length === 0) return void ctx.log(`No reference images found in ${folder}`);
    const choice = await chooseOption(ctx.ask, 'Which reference image?', images);
    panel.background.reference = relative(repoRoot, join(folder, images[choice])).split('\\').join('/');
    panel.background.mode = 'reference';
    writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  };

  const panelCount = loadCurrent().panels.length;
  const done = await reviewPanels(ctx, BACKGROUND_STAGE, {
    label: 'Background image', panelCount, generate, tweak,
    exists: (index) => existsSync(join(ctx.comicDir, backgroundFileName(index))),
    tweakLabel: (index) => isCrop(index) ? 'Adjust the crop with feedback' : undefined,
    extraActions: [
      {
        label: 'Tweak image with a prompt (interactive session)',
        when: isCrop,
        run: async (index) => {
          await aiTweak(index);
          return false;
        },
      },
      { label: 'Use a reference image (crop only, no AI generation)', run: useReferenceImage },
    ],
  });
  if (!done) return ctx.status;
  return {
    ...ctx.status,
    stage: BACKGROUND_STAGE + 1,
    completed: [...new Set([...ctx.status.completed, BACKGROUND_STAGE])],
  };
};
