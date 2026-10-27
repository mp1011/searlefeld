import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { validatePanels } from '../panels';
import { SITUATIONS_DIR, scaffoldComic } from '../scaffold';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'comic-'));
  mkdirSync(join(root, SITUATIONS_DIR), { recursive: true });
  mkdirSync(join(root, 'comic_src'));
  writeFileSync(join(root, SITUATIONS_DIR, 'nvidia.md'), '# nvidia');
  writeFileSync(join(root, 'outside.md'), '# outside');
});

const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

describe('scaffoldComic', () => {
  it('creates 000_ then 001_ folders with status.json and a four-panel panels.json', () => {
    const src = join(root, SITUATIONS_DIR, 'nvidia.md');
    const first = scaffoldComic(root, src);
    const second = scaffoldComic(root, src);
    expect(readdirSync(join(root, 'comic_src'))).toEqual(['000_nvidia', '001_nvidia']);
    expect(second.endsWith('001_nvidia')).toBe(true);
    expect(json(join(first, 'status.json'))).toEqual({ stage: 2, completed: [1] });
    const panels = json(join(first, 'panels.json'));
    expect(panels.source).toBe('agent_docs/comic_notes/situations/nvidia.md');
    expect(panels.panels).toHaveLength(4);
    expect(panels.panels.every((p: { characters: unknown[] }) => p.characters.length === 2)).toBe(true);
  });

  it('rejects a missing file and a file outside situations, creating nothing', () => {
    expect(() => scaffoldComic(root, join(root, SITUATIONS_DIR, 'nope.md'))).toThrow(/not found/);
    expect(() => scaffoldComic(root, join(root, 'outside.md'))).toThrow(/inside/);
    expect(readdirSync(join(root, 'comic_src'))).toEqual([]);
  });

  it('the CLI exits non-zero for a missing source', () => {
    const cli = join(__dirname, '..', 'cli.ts');
    const r = spawnSync(process.execPath, ['--import', 'tsx', cli, 'new', join(root, 'missing.md')], { encoding: 'utf8' });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/not found/);
  });
});

describe('validatePanels', () => {
  it('accepts the scaffolded template', () => {
    const dir = scaffoldComic(root, join(root, SITUATIONS_DIR, 'nvidia.md'));
    expect(validatePanels(readFileSync(join(dir, 'panels.json'), 'utf8'))).toEqual([]);
  });

  it('reports a syntax error with a line and column', () => {
    const [msg] = validatePanels('{\n  "source": "a",\n  oops\n}');
    expect(msg).toMatch(/syntax error/);
    expect(msg).toMatch(/line 3/);
  });

  it('names a panel missing characters and an out-of-range size', () => {
    const bad = JSON.stringify({
      source: 's', title: 't',
      panels: [{ width: 150, height: 10, row: 0, column: 0, background: { description: '' } }],
    });
    const errors = validatePanels(bad);
    expect(errors).toContain('panels.panels[0].characters must be an array');
    expect(errors.some((e) => e.startsWith('panels.panels[0].width must be between'))).toBe(true);
  });
});
