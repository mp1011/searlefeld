import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { writeFileAtomic } from './fsutil';

export interface CodexResult {
  exitCode: number;
  output: string;
}

/** Stage code depends on this interface so tests can stub the process launcher. */
export interface Codex {
  /** `codex exec`: runs the prompt, waits for exit, returns the captured output. */
  runNonInteractive(comicDir: string, prompt: string): Promise<CodexResult>;
  /** Hands over the terminal until the user exits Codex; returns its exit code. */
  runInteractive(comicDir: string, prompt: string): Promise<number>;
}

/** Writes the prompt to <comicDir>/logs/ so a run can be retraced. Returns the prompt file path. */
export function logPrompt(comicDir: string, prompt: string): string {
  const logs = join(comicDir, 'logs');
  mkdirSync(logs, { recursive: true });
  const n = String(readdirSync(logs).filter((f) => f.endsWith('.prompt.md')).length).padStart(3, '0');
  const path = join(logs, `${n}.prompt.md`);
  writeFileAtomic(path, prompt);
  return path;
}

function run(command: string, args: string[], opts: { input?: string; capture: boolean }): Promise<CodexResult> {
  return new Promise((resolve, reject) => {
    // codex is a .cmd shim on Windows, which spawn only accepts through a shell.
    const child = spawn(command, args, {
      shell: process.platform === 'win32',
      stdio: opts.capture ? ['pipe', 'pipe', 'pipe'] : 'inherit',
    });
    let output = '';
    child.stdout?.on('data', (d) => (output += d));
    child.stderr?.on('data', (d) => (output += d));
    child.on('error', reject);
    child.on('close', (code) => resolve({ exitCode: code ?? 1, output }));
    if (opts.input !== undefined) child.stdin?.end(opts.input);
  });
}

export function createCodex(command = 'codex', baseArgs: string[] = []): Codex {
  return {
    async runNonInteractive(comicDir, prompt) {
      const promptPath = logPrompt(comicDir, prompt);
      const result = await run(command, [...baseArgs, 'exec', '-C', comicDir, '-s', 'workspace-write', '--skip-git-repo-check', '-'], { input: prompt, capture: true });
      writeFileAtomic(promptPath.replace('.prompt.md', '.output.txt'), result.output);
      return result;
    },
    async runInteractive(comicDir, prompt) {
      const promptPath = logPrompt(comicDir, prompt);
      // A short instruction avoids multi-line prompts having to survive shell quoting.
      const instruction = `"Read ${promptPath} and follow the instructions in it."`;
      return (await run(command, [...baseArgs, instruction], { capture: false })).exitCode;
    },
  };
}
