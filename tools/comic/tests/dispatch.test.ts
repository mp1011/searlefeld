import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Codex } from '../codex';
import { dispatch } from '../dispatch';
import { notImplemented, stageHandlers, type StageHandler } from '../stages';
import { readStatus, writeStatus } from '../status';

const codex: Codex = { runNonInteractive: vi.fn(), runInteractive: vi.fn() };

const deps = (handlers: Record<number, StageHandler>, log: string[] = []) => ({
  handlers,
  codex,
  ask: async () => '',
  log: (m: string) => log.push(m),
});

const newComic = (stage: number, completed: number[]) => {
  const dir = mkdtempSync(join(tmpdir(), 'comic-'));
  writeStatus(dir, { stage, completed });
  return dir;
};

describe('dispatch', () => {
  it('calls only the handler for the stage in status.json', async () => {
    const dir = newComic(3, [1, 2]);
    const calls: number[] = [];
    const handlers: Record<number, StageHandler> = {};
    for (let n = 2; n <= 7; n++) {
      handlers[n] = async (ctx) => {
        calls.push(n);
        return ctx.status;
      };
    }
    await dispatch(dir, deps(handlers));
    expect(calls).toEqual([3]);
  });

  it('persists the status a handler returns and continues with the next stage', async () => {
    const dir = newComic(4, [1, 2, 3]);
    const handlers = { ...stageHandlers, 4: async () => ({ stage: 5, completed: [1, 2, 3, 4] }) };
    const log: string[] = [];
    await dispatch(dir, deps(handlers, log));
    expect(readStatus(dir).stage).toBe(5);
    expect(log.join('\n')).toMatch(/Stage 5 \(Character Generation\) is not implemented yet/);
  });

  it('prints "not implemented yet" and exits cleanly for unbuilt stages', async () => {
    const dir = newComic(2, [1]);
    const log: string[] = [];
    await dispatch(dir, deps({ 2: notImplemented(2) }, log));
    expect(log.join('\n')).toMatch(/not implemented yet/);
    expect(readStatus(dir).stage).toBe(2);
  });
});
