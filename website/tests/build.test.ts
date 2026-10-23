import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('build output', () => {
  it('index.html shows the latest comic image with its alt text', () => {
    execSync('npm run build', { stdio: 'pipe' });
    const html = readFileSync('dist/index.html', 'utf8');
    const img = html.match(/<img[^>]*>/g)?.find((t) => t.includes('/comics/0003-birthday.png'));
    expect(img).toBeDefined();
    expect(img).toContain('alt="Ailan opens birthday presents from her roommates."');
  });

  it('emits a permalink per comic with correct nav links', () => {
    for (const n of [1, 2, 3]) expect(existsSync(`dist/comic/${n}/index.html`)).toBe(true);
    const html = readFileSync('dist/comic/1/index.html', 'utf8');
    expect(html).toContain('href="/comic/2"');
    expect(html).not.toContain('data-nav="prev"');
  });

  it('emits a 404 page linking home', () => {
    expect(readFileSync('dist/404.html', 'utf8')).toContain('href="/"');
  });
}, 120000);
