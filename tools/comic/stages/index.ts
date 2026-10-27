import type { Codex } from '../codex';
import type { Ask } from '../menu';
import type { Status } from '../status';

export interface StageContext {
  comicDir: string;
  status: Status;
  codex: Codex;
  ask: Ask;
  log: (message: string) => void;
}

/** Runs one stage's menu/work and returns the status to continue with. */
export type StageHandler = (ctx: StageContext) => Promise<Status>;

export const STAGE_NAMES: Record<number, string> = {
  1: 'Scaffolding',
  2: 'Panel Descriptions',
  3: 'Panel Review',
  4: 'Background Generation',
  5: 'Character Generation',
  6: 'Speech',
  7: 'Final touches',
};

export const notImplemented = (stage: number): StageHandler => async (ctx) => {
  ctx.log(`Stage ${stage} (${STAGE_NAMES[stage]}) is not implemented yet.`);
  return ctx.status;
};

/** Later stage subtasks replace their entry here. */
export const stageHandlers: Record<number, StageHandler> = Object.fromEntries(
  [2, 3, 4, 5, 6, 7].map((n) => [n, notImplemented(n)]),
);
