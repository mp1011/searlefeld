import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import type { Codex } from '../codex';
import { chooseOption } from '../menu';
import { validateLayout, validatePanels, validateReferences, type Panels } from '../panels';
import { resolveReference } from './background';
import type { StageHandler } from './index';

export const PANELS_STAGE = 2;
export const MAX_RETRIES = 3;

const CHARACTERS_DIR = join('agent_docs', 'comic_notes', 'characters');
const LOCATION_DIR = join('agent_docs', 'comic_notes', 'reference_images', 'location');
const IMAGE = /\.(png|jpe?g|webp)$/i;

const toPosix = (p: string) => p.split(sep).join('/');

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

/** Cast names: the .md file names (without extension) in characters/ and its subfolders. */
export function listCast(repoRoot: string): string[] {
  return walk(join(repoRoot, CHARACTERS_DIR))
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.slice(f.lastIndexOf(sep) + 1, -3));
}

/** Repo-relative paths of the background reference images. */
export function listReferences(repoRoot: string): string[] {
  return walk(join(repoRoot, LOCATION_DIR)).filter((f) => IMAGE.test(f)).map((f) => toPosix(relative(repoRoot, f)));
}

export interface PromptInputs {
  panelsPath: string;
  sourcePath: string;
  cast: string[];
  references: string[];
}

export function panelDescriptionsPrompt(i: PromptInputs): string {
  return [
    `Read the comic situation in ${i.sourcePath} and fill in the panels file ${i.panelsPath} (keep the existing JSON structure and "source" value; set "title").`,
    "Decide the number of panels, their layout, each panel's background, and the characters with their action, mood and dialogue.",
    '',
    'Layout rules:',
    '- width and height are percentages (0-100) of the whole comic area; row and column are 0-based positions.',
    '- The panels in one row must have widths that sum to exactly 100.',
    '- No two panels may share the same row and column.',
    '',
    `Cast (use these names for "character"): ${i.cast.join(', ')}`,
    '',
    'Background references: set background.reference to one of these paths exactly, or leave it empty and describe the background in background.description:',
    ...i.references.map((r) => `- ${r}`),
    '',
    'Write valid JSON only; edit the file in place.',
  ].join('\n');
}

export function fixPrompt(base: string, panelsPath: string, errors: string[]): string {
  return `${base}\n\nThe file ${panelsPath} you wrote is invalid. Fix it in place. Errors:\n${errors.map((e) => `- ${e}`).join('\n')}`;
}

export interface FillDeps {
  codex: Codex;
  comicDir: string;
  prompt: string;
  /** Returns the current validation errors (empty when panels.json is valid). */
  validate: () => string[];
}

/** Runs Codex, then re-runs it with the errors up to MAX_RETRIES times. Returns the remaining errors. */
export async function fillPanels(deps: FillDeps, panelsPath: string): Promise<string[]> {
  await deps.codex.runNonInteractive(deps.comicDir, deps.prompt);
  let errors = deps.validate();
  for (let retry = 0; retry < MAX_RETRIES && errors.length > 0; retry++) {
    await deps.codex.runNonInteractive(deps.comicDir, fixPrompt(deps.prompt, panelsPath, errors));
    errors = deps.validate();
  }
  return errors;
}

export function summarize(panels: Panels): string {
  const lines = panels.panels.map(
    (p, i) => `  Panel ${i + 1}: ${p.characters.map((c) => c.character).join(', ') || '(no characters)'}`,
  );
  return `${panels.panels.length} panels:\n${lines.join('\n')}`;
}

/** All validation errors for a panels.json on disk: syntax, shape, layout and background references. */
export function validatePanelsFile(repoRoot: string, panelsPath: string): string[] {
  const text = readFileSync(panelsPath, 'utf8');
  const errors = validatePanels(text);
  if (errors.length > 0) return errors;
  const panels = JSON.parse(text) as Panels;
  return [
    ...(panels.panels.length === 0 ? ['panels.panels must contain at least one panel'] : []),
    ...validateLayout(panels),
    ...validateReferences(panels, (ref) => existsSync(resolveReference(repoRoot, ref))),
  ];
}

export const panelDescriptionsStage: StageHandler = async (ctx) => {
  const repoRoot = dirname(dirname(ctx.comicDir));
  const panelsPath = join(ctx.comicDir, 'panels.json');
  const read = () => readFileSync(panelsPath, 'utf8');

  const validate = () => validatePanelsFile(repoRoot, panelsPath);

  const finish = () => {
    ctx.log(summarize(JSON.parse(read()) as Panels));
    return {
      ...ctx.status,
      stage: PANELS_STAGE + 1,
      completed: [...new Set([...ctx.status.completed, PANELS_STAGE])],
    };
  };

  const current = JSON.parse(read()) as Partial<Panels>;
  const prompt = panelDescriptionsPrompt({
    panelsPath,
    sourcePath: join(repoRoot, current.source ?? ''),
    cast: listCast(repoRoot),
    references: listReferences(repoRoot),
  });

  // A file that already has a title was filled by an earlier run; only offer the menu then.
  for (let first = !current.title; ; first = false) {
    if (!first) {
      const errors = validate();
      if (errors.length === 0) return finish();
      ctx.log(`${panelsPath} is not valid:\n- ${errors.join('\n- ')}`);
      const choice = await chooseOption(ctx.ask, 'What now?', ['Retry Codex', 'I fixed it by hand (re-validate)', 'Quit']);
      if (choice === 1) continue;
      if (choice === 2) return ctx.status;
    }
    const errors = await fillPanels({ codex: ctx.codex, comicDir: ctx.comicDir, prompt, validate }, panelsPath);
    if (errors.length === 0) return finish();
    ctx.log(`Codex could not produce a valid ${panelsPath} after ${MAX_RETRIES} retries:\n- ${errors.join('\n- ')}`);
    return ctx.status;
  }
};
