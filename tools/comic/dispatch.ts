import type { Codex } from './codex';
import type { Ask } from './menu';
import { LAST_STAGE, readStatus, writeStatus } from './status';
import { STAGE_NAMES, type StageContext, type StageHandler } from './stages';

export interface DispatchDeps {
  handlers: Record<number, StageHandler>;
  codex: Codex;
  ask: Ask;
  log: (message: string) => void;
}

/** Runs the current stage's handler, persisting progress, until a stage makes no progress. */
export async function dispatch(comicDir: string, deps: DispatchDeps): Promise<void> {
  let status = readStatus(comicDir);
  for (;;) {
    if (status.stage > LAST_STAGE) {
      const finished = deps.handlers[status.stage];
      if (finished) await finished({ comicDir, status, codex: deps.codex, ask: deps.ask, log: deps.log });
      else deps.log('All stages are complete.');
      return;
    }
    deps.log(`Stage ${status.stage}: ${STAGE_NAMES[status.stage] ?? 'unknown'}`);
    const handler = deps.handlers[status.stage];
    if (!handler) throw new Error(`No handler for stage ${status.stage}`);
    const ctx: StageContext = { comicDir, status, codex: deps.codex, ask: deps.ask, log: deps.log };
    const next = await handler(ctx);
    if (next.stage === status.stage) return;
    writeStatus(comicDir, next);
    status = next;
  }
}
