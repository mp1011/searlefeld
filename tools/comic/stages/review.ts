import { chooseOption } from '../menu';
import { writeStatus } from '../status';
import type { StageContext } from './index';

export interface PanelResult {
  ok: boolean;
  /** Where the image was written, or what went wrong. */
  message: string;
}

export interface ReviewSteps {
  /** What the user is reviewing, e.g. "Background image". */
  label: string;
  panelCount: number;
  /** Produces the image for one panel from the current panels.json. */
  generate: (index: number) => Promise<PanelResult>;
  /** Opens an interactive session for the user to tweak the image generate() just made. */
  tweak: (index: number) => Promise<void>;
}

const isYes = (answer: string) => /^y/i.test(answer.trim());

/**
 * The per-panel generate -> continue / tweak / edit panels.json loop shared by Stages 4-6.
 * Accepted panels are saved in status.json, so a rerun resumes at the first unaccepted one.
 * Returns true when every panel is accepted, false when the user quit.
 */
export async function reviewPanels(ctx: StageContext, stage: number, steps: ReviewSteps): Promise<boolean> {
  const key = String(stage);
  const accepted = new Set(ctx.status.accepted?.[key] ?? []);
  const save = () => {
    ctx.status = { ...ctx.status, accepted: { ...ctx.status.accepted, [key]: [...accepted].sort((a, b) => a - b) } };
    writeStatus(ctx.comicDir, ctx.status);
  };

  for (let i = 0; i < steps.panelCount; i++) {
    if (accepted.has(i)) continue;
    let needsGeneration = true;
    for (;;) {
      if (needsGeneration) {
        const result = await steps.generate(i);
        if (!result.ok) {
          ctx.log(`Panel ${i}: ${result.message}`);
          if (/^r/i.test((await ctx.ask('Retry or quit? (r/q) ')).trim())) continue;
          return false;
        }
        ctx.log(`${steps.label} ${result.message} created.`);
        needsGeneration = false;
      }
      const answer = await ctx.ask('Continue? (y/n, q to quit and resume later) ');
      if (isYes(answer)) break;
      if (/^q/i.test(answer.trim())) return false;
      const choice = await chooseOption(ctx.ask, 'What next?', [
        'Tweak image with a prompt (interactive session)',
        'Edit panels.json and re-generate',
      ]);
      if (choice === 0) {
        await steps.tweak(i);
      } else {
        await ctx.ask('Press Enter once panels.json is updated. ');
        needsGeneration = true;
      }
    }
    accepted.add(i);
    save();
  }
  return true;
}
