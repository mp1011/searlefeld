import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { cast } from '../src/lib/cast';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { describe, expect, it } from 'vitest';

describe('build output', () => {
  it('index.html shows the latest comic image with its alt text', () => {
    execSync('npm run build', { stdio: 'pipe' });
    const html = readFileSync('dist/index.html', 'utf8');
    const img = html.match(/<img[^>]*>/g)?.find((t) => t.includes('/comics/0002-human.png'));
    expect(img).toBeDefined();
    expect(img).toContain('alt="Ailan shows off his new human appearance to Max and Roko."');
  });

  it('emits a permalink per comic with correct nav links', () => {
    for (const n of [1, 2]) expect(existsSync(`dist/comic/${n}/index.html`)).toBe(true);
    const html1 = readFileSync('dist/comic/1/index.html', 'utf8');
    expect(html1).toContain('href="/comic/2"');
    expect(html1).not.toContain('data-nav="prev"');
    const html2 = readFileSync('dist/comic/2/index.html', 'utf8');
    expect(html2).toContain('href="/comic/1"');
    expect(html2).not.toContain('data-nav="next"');
  });

  it('renders comic social metadata and RSS discovery on every page', () => {
    const html = readFileSync('dist/comic/1/index.html', 'utf8');
    expect(html).toContain('<title>Credit Where It&#39;s Due</title>');
    for (const [property, value] of Object.entries({
      'og:title': "Credit Where It's Due",
      'og:description': 'Roko storms into the apartment, worried about whether an NVidia customer helped create him.',
      'og:image': 'http://localhost:4321/comics/0001-nvidia.png',
      'og:url': 'http://localhost:4321/comic/1/',
      'og:type': 'website',
    })) expect(html).toContain(`property="${property}" content="${value}"`);
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    for (const file of ['index.html', '404.html', 'about/index.html', 'archive/index.html', ...[1, 2].map((n) => `comic/${n}/index.html`)]) {
      const page = readFileSync(`dist/${file}`, 'utf8');
      expect(page).toMatch(/<link\b[^>]*rel="alternate"[^>]*type="application\/rss\+xml"[^>]*href="http:\/\/localhost:4321\/rss.xml"/);
      expect(page).toMatch(/<footer\b[\s\S]*href="\/rss.xml"[^>]*>RSS<\/a>[\s\S]*<\/footer>/);
    }
    expect(readFileSync('dist/index.html', 'utf8')).toContain('property="og:title" content="Searlefeld"');
  });

  it('emits valid RSS 2.0 with every comic newest first and strip images', () => {
    const xml = readFileSync('dist/rss.xml', 'utf8');
    expect(XMLValidator.validate(xml)).toBe(true);
    const feed = new XMLParser({ ignoreAttributes: false }).parse(xml);
    expect(feed.rss['@_version']).toBe('2.0');
    const items = feed.rss.channel.item;
    expect(items).toHaveLength(2);
    expect(items.map((item: { title: string }) => item.title)).toEqual(['Human Speak', "Credit Where It's Due"]);
    items.forEach((item: { link: string; description: string }, index: number) => {
      expect(item.link).toMatch(new RegExp(`^http://localhost:4321/comic/${2 - index}/?$`));
      expect(item.description).toMatch(/<img src="http:\/\/localhost:4321\/comics\/[^ "]+\.png" alt="[^"]+"/);
    });
  });

  it('renders the chronological archive with linked thumbnails, metadata and current navigation', () => {
    const html = readFileSync('dist/archive/index.html', 'utf8');
    const entries = [...html.matchAll(/<a\b[^>]*href="\/comic\/(\d+)"[^>]*>([\s\S]*?)<\/a>/g)];
    expect(entries.map((entry) => Number(entry[1]))).toEqual([1, 2]);
    const expected = [
      ['Credit Where It&#39;s Due', '/comics/0001-nvidia.png', 'Roko storms into the apartment, worried about whether an NVidia customer helped create him.'],
      ['Human Speak', '/comics/0002-human.png', 'Ailan shows off his new human appearance to Max and Roko.'],
    ];
    entries.forEach((entry, index) => {
      const [, , body] = entry;
      const [title, image, alt] = expected[index];
      expect(body).toContain(`#${index + 1}`);
      expect(body).toContain(title);
      expect(body).not.toContain('<time');
      const img = body.match(/<img\b[^>]*>/)?.[0];
      expect(img).toContain(`src="${image}"`);
      expect(img).toContain(`alt="${alt}"`);
    });
    const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0];
    expect(header).toMatch(/<a\b[^>]*href="\/archive"[^>]*aria-current="page"[^>]*>Archive<\/a>/);
    expect(readFileSync('dist/index.html', 'utf8')).not.toMatch(/href="\/archive"[^>]*aria-current="page"/);
  });

  it('emits a 404 page linking home', () => {
    expect(readFileSync('dist/404.html', 'utf8')).toContain('href="/"');
  });

  it('renders the about premise, cast portraits, appearances and navigation', () => {
    const html = readFileSync('dist/about/index.html', 'utf8');
    expect(html).toContain('Four AI thought experiments');
    expect(html).toContain('/cast/cast-portrait-v1.png');
    const cards = [...html.matchAll(/<article\b[^>]*data-character="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
    expect(cards.map((card) => card[1])).toEqual(['roko', 'max', 'ailan', 'chinese_room']);
    const expectedAppearances: Record<string, number[]> = {
      roko: [1, 2], max: [1, 2], ailan: [2], chinese_room: [1],
    };
    for (const [, key, body] of cards) {
      expect(body).toMatch(/<img\b[^>]*alt="[^"]+"/);
      expect([...body.matchAll(/href="\/comic\/(\d+)"/g)].map((match) => Number(match[1])))
        .toEqual(expectedAppearances[key]);
      const portrait = cast[key as keyof typeof cast].image;
      expect(body).toContain(`src="${portrait}"`);
      const filename = portrait.split('/').pop();
      const refPath = existsSync(`../agent_docs/comic_notes/reference_images/character/${key}/${filename}`)
        ? `../agent_docs/comic_notes/reference_images/character/${key}/${filename}`
        : `../agent_docs/comic_notes/reference_images/character/${filename}`;
      expect(readFileSync(`dist${portrait}`).equals(readFileSync(refPath))).toBe(true);
    }
    expect(readFileSync('dist/cast/cast-portrait-v1.png').equals(
      readFileSync('../agent_docs/comic_notes/reference_images/character/cast-portrait-v1.png'),
    )).toBe(true);
    expect(html).toMatch(/<header\b[\s\S]*href="\/about"[^>]*>About<\/a>[\s\S]*<\/header>/);
    expect(html).toMatch(/<footer\b[\s\S]*href="\/about"[^>]*>Cast<\/a>[\s\S]*<\/footer>/);
  });
}, 120000);
