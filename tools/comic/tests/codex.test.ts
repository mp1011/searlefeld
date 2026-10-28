import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createCodex } from '../codex';

const STUB = [
  "let input = '';",
  "process.stdin.on('data', (d) => (input += d));",
  "process.stdin.on('end', () => {",
  "  console.log('args=' + process.argv.slice(2).join(',') + ' prompt=' + input);",
  '  process.exit(3);',
  '});',
].join('\n');

describe('createCodex', () => {
  it('passes the prompt on stdin, captures output, reports the exit code and logs the prompt', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'comic-'));
    const stub = join(dir, 'stub.mjs');
    writeFileSync(stub, STUB);
    const result = await createCodex('node', [stub]).runNonInteractive(dir, 'draw a cat');
    expect(result.exitCode).toBe(3);
    expect(result.output).toContain(`args=exec,-C,${dir},-s,workspace-write,--skip-git-repo-check,- prompt=draw a cat`);
    expect(readFileSync(join(dir, 'logs', '000.prompt.md'), 'utf8')).toBe('draw a cat');
  });
});
