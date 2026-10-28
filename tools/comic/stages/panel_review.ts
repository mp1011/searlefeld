import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { chooseOption } from '../menu';
import type { Panels } from '../panels';
import type { Status } from '../status';
import { validatePanelsFile } from './panels';
import type { StageContext, StageHandler } from './index';

export const PANEL_REVIEW_STAGE = 3;

/** Human-readable summary of a parsed panels.json. */
export function formatSummary(panels: Panels): string {
  const lines = [`Title: ${panels.title}`, `Source: ${panels.source}`];
  panels.panels.forEach((p, i) => {
    const bg = [p.background.reference?.trim() && `reference ${p.background.reference.trim()}`, p.background.description.trim()]
      .filter(Boolean)
      .join(' - ');
    lines.push(
      '',
      `Panel ${i + 1}: row ${p.row}, column ${p.column}, ${p.width}% x ${p.height}%`,
      `  Background: ${bg || '(none)'}`,
    );
    for (const c of p.characters) {
      lines.push(`  ${c.character}: ${c.action} [${c.mood}]`, `    "${c.dialogue}"`);
    }
  });
  return lines.join('\n');
}

export function interactivePrompt(panelsPath: string): string {
  return `Work with the user to improve the contents of ${panelsPath}. The user will specify what they want to change. Keep the file valid JSON with the same structure.`;
}

const OPTIONS = ['I edited the file, re-check', 'Edit panels.json interactively', 'Approve', 'Quit'];

/** The Stage 3 menu loop; the validator is a dependency so tests can drive it. */
export async function reviewMenu(ctx: StageContext, panelsPath: string, validate: () => string[]): Promise<Status> {
  for (;;) {
    const errors = validate();
    if (errors.length === 0) ctx.log(formatSummary(JSON.parse(readFileSync(panelsPath, 'utf8')) as Panels));
    else ctx.log(`${panelsPath} is not valid:\n- ${errors.join('\n- ')}`);
    ctx.log(`File: ${panelsPath}`);

    const choice = await chooseOption(ctx.ask, 'Panel review', OPTIONS);
    if (choice === 1) {
      await ctx.codex.runInteractive(ctx.comicDir, interactivePrompt(panelsPath));
    } else if (choice === 2) {
      const current = validate();
      if (current.length === 0) {
        return {
          ...ctx.status,
          stage: PANEL_REVIEW_STAGE + 1,
          completed: [...new Set([...ctx.status.completed, PANEL_REVIEW_STAGE])],
        };
      }
      ctx.log(`Cannot approve, ${panelsPath} is not valid:\n- ${current.join('\n- ')}`);
    } else if (choice === 3) {
      return ctx.status;
    }
  }
}

export const panelReviewStage: StageHandler = (ctx) => {
  const panelsPath = join(ctx.comicDir, 'panels.json');
  const repoRoot = dirname(dirname(ctx.comicDir));
  return reviewMenu(ctx, panelsPath, () => validatePanelsFile(repoRoot, panelsPath));
};
